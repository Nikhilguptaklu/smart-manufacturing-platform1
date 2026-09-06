const express = require("express");
const { createSupabaseClient } = require("../config/supabase");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

const getSupabase = () => createSupabaseClient();

const listWithQuery = async (req, res, table, options = {}) => {
  const { select = "*", orderBy, orderDirection = "desc", join = "" } = options;
  const supabase = getSupabase();

  let query = supabase.from(table).select(select);

  if (options.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query = query.eq(key, value);
      }
    });
  }

  if (req.query.search) {
    const searchField = options.searchField || "product_name";
    query = query.ilike(searchField, `%${req.query.search}%`);
  }

  if (orderBy) {
    query = query.order(orderBy, { ascending: orderDirection === "asc" });
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch records",
      error: error.message,
    });
  }

  return res.json({ success: true, data });
};

const getById = async (req, res, table, options = {}) => {
  const { select = "*" } = options;
  const supabase = getSupabase();

  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "Missing id parameter" });
  }

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch record",
      error: error.message,
    });
  }

  if (!data) {
    return res.status(404).json({
      success: false,
      message: `${table} not found`,
    });
  }

  return res.json({ success: true, data });
};

const createRecord = async (req, res, table) => {
  const supabase = getSupabase();

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Request body required" });
  }

  const { data, error } = await supabase
    .from(table)
    .insert(req.body)
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create record",
      error: error.message,
    });
  }

  return res.status(201).json({ success: true, data });
};

const updateRecord = async (req, res, table) => {
  const supabase = getSupabase();
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "Missing id parameter" });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Request body required" });
  }

  const { data, error } = await supabase
    .from(table)
    .update(req.body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update record",
      error: error.message,
    });
  }

  return res.json({ success: true, data });
};

const deleteRecord = async (req, res, table) => {
  const supabase = getSupabase();
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "Missing id parameter" });
  }

  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to delete record",
      error: error.message,
    });
  }

  return res.json({ success: true, message: `${table} deleted successfully` });
};

router.use(authMiddleware);

// PRODUCTS
router.get("/products", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => {
  return listWithQuery(req, res, "products", { searchField: "product_name" });
});

router.get("/products/:id", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => getById(req, res, "products"));
router.post("/products", roleMiddleware("admin", "manager"), async (req, res) => createRecord(req, res, "products"));
router.put("/products/:id", roleMiddleware("admin", "manager"), async (req, res) => updateRecord(req, res, "products"));
router.delete("/products/:id", roleMiddleware("admin", "manager"), async (req, res) => deleteRecord(req, res, "products"));

// INVENTORY
router.get("/inventory", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => {
  return listWithQuery(req, res, "inventory", { searchField: "item_name" });
});

router.get("/inventory/:id", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => getById(req, res, "inventory"));
router.post("/inventory", roleMiddleware("admin", "manager"), async (req, res) => createRecord(req, res, "inventory"));
router.put("/inventory/:id", roleMiddleware("admin", "manager"), async (req, res) => updateRecord(req, res, "inventory"));
router.delete("/inventory/:id", roleMiddleware("admin", "manager"), async (req, res) => deleteRecord(req, res, "inventory"));

// CUSTOMERS
router.get("/customers", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => listWithQuery(req, res, "customers", { searchField: "company_name" }));
router.post("/customers", roleMiddleware("admin", "manager"), async (req, res) => createRecord(req, res, "customers"));
router.put("/customers/:id", roleMiddleware("admin", "manager"), async (req, res) => updateRecord(req, res, "customers"));
router.delete("/customers/:id", roleMiddleware("admin", "manager"), async (req, res) => deleteRecord(req, res, "customers"));

// SUPPLIERS
router.get("/suppliers", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => listWithQuery(req, res, "suppliers", { searchField: "supplier_name" }));
router.post("/suppliers", roleMiddleware("admin", "manager"), async (req, res) => createRecord(req, res, "suppliers"));
router.put("/suppliers/:id", roleMiddleware("admin", "manager"), async (req, res) => updateRecord(req, res, "suppliers"));
router.delete("/suppliers/:id", roleMiddleware("admin", "manager"), async (req, res) => deleteRecord(req, res, "suppliers"));

// SALES ORDERS
router.get("/sales-orders", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => listWithQuery(req, res, "sales_orders", { searchField: "order_number" }));
router.get("/sales-orders/:id", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => getById(req, res, "sales_orders", { select: "*, customer:customers(*)" }));
router.post("/sales-orders", roleMiddleware("admin", "manager"), async (req, res) => createRecord(req, res, "sales_orders"));
router.put("/sales-orders/:id", roleMiddleware("admin", "manager"), async (req, res) => updateRecord(req, res, "sales_orders"));
router.delete("/sales-orders/:id", roleMiddleware("admin", "manager"), async (req, res) => deleteRecord(req, res, "sales_orders"));

// PRODUCTION ORDERS
router.get("/production-orders", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => listWithQuery(req, res, "production_orders", { searchField: "production_number" }));
router.get("/production-orders/:id", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => getById(req, res, "production_orders"));
router.post("/production-orders", roleMiddleware("admin", "manager"), async (req, res) => createRecord(req, res, "production_orders"));
router.put("/production-orders/:id", roleMiddleware("admin", "manager"), async (req, res) => updateRecord(req, res, "production_orders"));
router.delete("/production-orders/:id", roleMiddleware("admin", "manager"), async (req, res) => deleteRecord(req, res, "production_orders"));

// PRODUCT VERSIONS
router.get("/product-versions", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => listWithQuery(req, res, "product_versions"));
router.post("/product-versions", roleMiddleware("admin", "manager", "engineer"), async (req, res) => createRecord(req, res, "product_versions"));
router.put("/product-versions/:id", roleMiddleware("admin", "manager", "engineer"), async (req, res) => updateRecord(req, res, "product_versions"));

// BOMS
router.get("/boms", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => listWithQuery(req, res, "boms", { select: "*, product:products(*)" }));
router.get("/boms/:id", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => getById(req, res, "boms", { select: "*, product:products(*)" }));
router.post("/boms", roleMiddleware("admin", "manager", "engineer"), async (req, res) => createRecord(req, res, "boms"));
router.put("/boms/:id", roleMiddleware("admin", "manager", "engineer"), async (req, res) => updateRecord(req, res, "boms"));
router.delete("/boms/:id", roleMiddleware("admin", "manager", "engineer"), async (req, res) => deleteRecord(req, res, "boms"));

// COMPONENTS
router.get("/components", roleMiddleware("admin", "manager", "engineer", "employee"), async (req, res) => listWithQuery(req, res, "components"));
router.post("/components", roleMiddleware("admin", "manager", "engineer"), async (req, res) => createRecord(req, res, "components"));
router.put("/components/:id", roleMiddleware("admin", "manager", "engineer"), async (req, res) => updateRecord(req, res, "components"));
router.delete("/components/:id", roleMiddleware("admin", "manager", "engineer"), async (req, res) => deleteRecord(req, res, "components"));

module.exports = router;
