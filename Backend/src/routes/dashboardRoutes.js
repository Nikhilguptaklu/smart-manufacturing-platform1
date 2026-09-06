const express = require("express");
const { createSupabaseClient } = require("../config/supabase");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

const getSupabase = () => createSupabaseClient();

function buildMonthlyLabels() {
  const labels = [];
  const today = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - index, 1);
    labels.push({
      key: monthDate.toLocaleString("en-US", { month: "short" }),
      month: monthDate.toLocaleString("en-US", { month: "short" }),
    });
  }

  return labels;
}

function monthKeyFromDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", { month: "short" });
}

/**
 * GET /api/dashboard/chart-data
 * Returns all chart data from the database
 */
router.get(
  "/chart-data",
  roleMiddleware("admin", "manager", "engineer", "employee"),
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const monthLabels = buildMonthlyLabels();
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

      const [productionResult, salesResult, productionStatusResult, inventoryStatusResult] = await Promise.all([
        supabase
          .from("production_orders")
          .select("created_at, quantity, status")
          .gte("created_at", startDate),
        supabase
          .from("sales_orders")
          .select("order_date, total_amount, status")
          .gte("order_date", startDate.slice(0, 10)),
        supabase.from("production_orders").select("status"),
        supabase.from("inventory").select("status"),
      ]);

      if (productionResult.error) throw productionResult.error;
      if (salesResult.error) throw salesResult.error;
      if (productionStatusResult.error) throw productionStatusResult.error;
      if (inventoryStatusResult.error) throw inventoryStatusResult.error;

      const productionByMonth = Object.fromEntries(monthLabels.map((item) => [item.key, 0]));
      const salesByMonth = Object.fromEntries(monthLabels.map((item) => [item.key, { orders: 0, revenue: 0 }]));

      (productionResult.data || []).forEach((order) => {
        const month = monthKeyFromDate(order.created_at);
        if (!month || !Object.prototype.hasOwnProperty.call(productionByMonth, month)) return;
        productionByMonth[month] += Number(order.quantity || 0);
      });

      (salesResult.data || []).forEach((order) => {
        const month = monthKeyFromDate(order.order_date);
        if (!month || !Object.prototype.hasOwnProperty.call(salesByMonth, month)) return;
        salesByMonth[month].orders += 1;
        salesByMonth[month].revenue += Number(order.total_amount || 0);
      });

      const monthlyProduction = monthLabels.map((entry) => ({
        month: entry.month,
        units: productionByMonth[entry.key] || 0,
      }));

      const salesTrend = monthLabels.map((entry) => ({
        month: entry.month,
        orders: salesByMonth[entry.key]?.orders || 0,
        revenue: salesByMonth[entry.key]?.revenue || 0,
      }));

      const productionSummary = {
        in_production: 0,
        completed: 0,
        pending: 0,
        on_hold: 0,
      };

      (productionStatusResult.data || []).forEach((order) => {
        const status = (order.status || "").toLowerCase();
        if (Object.prototype.hasOwnProperty.call(productionSummary, status)) {
          productionSummary[status] += 1;
        }
      });

      const inventorySummary = {
        healthy: 0,
        low_stock: 0,
        critical: 0,
      };

      (inventoryStatusResult.data || []).forEach((item) => {
        const status = (item.status || "").toLowerCase();
        if (Object.prototype.hasOwnProperty.call(inventorySummary, status)) {
          inventorySummary[status] += 1;
        }
      });

      const productionStatus = [
        { name: "In Production", value: productionSummary.in_production || 0, color: "#3b82f6" },
        { name: "Completed", value: productionSummary.completed || 0, color: "#10b981" },
        { name: "Pending", value: productionSummary.pending || 0, color: "#f59e0b" },
        { name: "On Hold", value: productionSummary.on_hold || 0, color: "#f97316" },
      ];

      const machineStatus = [
        { name: "Running", value: productionSummary.in_production || 0, color: "#10b981" },
        { name: "Warning", value: productionSummary.pending || 0, color: "#f59e0b" },
        { name: "Maintenance", value: productionSummary.on_hold || 0, color: "#f97316" },
        { name: "Stopped", value: inventorySummary.critical || 0, color: "#ef4444" },
      ];

      return res.json({
        success: true,
        data: {
          monthlyProduction,
          salesTrend,
          productionStatus,
          machineStatus,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard chart data",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/dashboard/stats
 * Returns key statistics for the dashboard
 */
router.get("/stats", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => {
  try {
    const supabase = getSupabase();
    const [
      productsResult,
      inventoryResult,
      customersResult,
      productionOrdersResult,
      salesOrdersResult,
      lowStockResult,
      completedProductionResult,
    ] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("inventory").select("id", { count: "exact", head: true }),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("production_orders").select("id", { count: "exact", head: true }),
      supabase
        .from("sales_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("inventory")
        .select("id", { count: "exact", head: true })
        .in("status", ["low_stock", "critical"]),
      supabase
        .from("production_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
    ]);

    // Get production orders to calculate average progress
    const { data: prodOrders } = await supabase
      .from("production_orders")
      .select("progress");

    const avgProgress =
      prodOrders && prodOrders.length > 0
        ? Math.round(
            prodOrders.reduce((sum, order) => sum + (order.progress || 0), 0) /
              prodOrders.length
          )
        : 0;

    const stats = {
      products: productsResult.count || 0,
      inventory: inventoryResult.count || 0,
      activeCustomers: customersResult.count || 0,
      activeProduction: productionOrdersResult.count || 0,
      pendingOrders: salesOrdersResult.count || 0,
      lowStock: lowStockResult.count || 0,
      completedProduction: completedProductionResult.count || 0,
      avgProgress: avgProgress,
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/recent-orders
 * Returns recent sales and production orders
 */
router.get(
  "/recent-orders",
  roleMiddleware("admin", "manager", "engineer", "employee"),
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const [salesResult, productionResult] = await Promise.all([
        supabase
          .from("sales_orders")
          .select("*, customer:customers(company_name)")
          .order("order_date", { ascending: false })
          .limit(5),
        supabase
          .from("production_orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      return res.json({
        success: true,
        data: {
          salesOrders: salesResult.data || [],
          productionOrders: productionResult.data || [],
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch recent orders",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/dashboard/production-summary
 * Returns production status breakdown
 */
router.get(
  "/production-summary",
  roleMiddleware("admin", "manager", "engineer", "employee"),
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { data: orders, error } = await supabase
        .from("production_orders")
        .select("status");

      if (error) throw error;

      const summary = {
        in_production: 0,
        completed: 0,
        pending: 0,
        on_hold: 0,
      };

      orders.forEach((order) => {
        const status = order.status;
        if (Object.prototype.hasOwnProperty.call(summary, status)) {
          summary[status]++;
        }
      });

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch production summary",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/dashboard/inventory-summary
 * Returns inventory status breakdown
 */
router.get(
  "/inventory-summary",
  roleMiddleware("admin", "manager", "engineer", "employee"),
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { data: items, error } = await supabase
        .from("inventory")
        .select("status");

      if (error) throw error;

      const summary = {
        healthy: 0,
        low_stock: 0,
        critical: 0,
      };

      items.forEach((item) => {
        const status = item.status;
        if (Object.prototype.hasOwnProperty.call(summary, status)) {
          summary[status]++;
        }
      });

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch inventory summary",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/dashboard/low-stock-items
 * Returns items with low or critical stock
 */
router.get(
  "/low-stock-items",
  roleMiddleware("admin", "manager", "engineer", "employee"),
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .in("status", ["low_stock", "critical"])
        .order("current_stock", { ascending: true })
        .limit(10);

      if (error) throw error;

      return res.json({
        success: true,
        data: data || [],
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch low stock items",
        error: error.message,
      });
    }
  }
);

module.exports = router;
