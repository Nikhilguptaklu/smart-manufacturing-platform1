const supabase = require("../config/supabase");

const normalizeRole = (role) => {
  if (!role) return "employee";
  const normalized = String(role).trim().toLowerCase();
  if (["admin", "manager", "engineer", "employee", "customer"].includes(normalized)) {
    return normalized;
  }
  return "employee";
};

const isCustomerUser = (user) => {
  if (!user) return false;

  const explicitRole = user.role || user.user_metadata?.role || user.profile?.role;
  return normalizeRole(explicitRole) === "customer";
};

const ensureCustomerRecordForUser = async (user) => {
  if (!user || !user.id) return null;

  const userId = user.id;
  const normalizedEmail = (user.email || "").trim().toLowerCase();

  try {
    const { data: existingCustomer, error: existingError } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingError && existingCustomer) {
      return existingCustomer;
    }
  } catch (columnError) {
    // Older schemas may not yet have the customers.user_id column.
  }

  if (normalizedEmail) {
    try {
      const { data: customerByEmail, error: emailError } = await supabase
        .from("customers")
        .select("*")
        .ilike("email", normalizedEmail)
        .maybeSingle();

      if (!emailError && customerByEmail) {
        return customerByEmail;
      }
    } catch (emailLookupError) {
      // Ignore legacy schema mismatches and continue to profile-based fallback.
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, phone")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("CUSTOMER PROFILE LOOKUP ERROR:", profileError);
    return null;
  }

  if (!profile && !isCustomerUser(user)) {
    return null;
  }

  const profileRole = normalizeRole(profile?.role || user?.role || user?.user_metadata?.role || "customer");
  if (profileRole !== "customer" && !isCustomerUser(user)) {
    return null;
  }

  const fallbackCustomer = {
    user_id: userId,
    company_name: profile?.full_name || user?.user_metadata?.full_name || user?.full_name || "Customer",
    contact_person: profile?.full_name || user?.user_metadata?.full_name || user?.full_name || "Customer",
    email: profile?.email || user.email || normalizedEmail || `${userId}@customer.local`,
    phone: profile?.phone || user?.phone || user?.user_metadata?.phone || null,
    country: "US",
    industry: "Retail",
    status: "active",
  };

  try {
    let createdCustomer = null;
    let createError = null;

    try {
      const result = await supabase
        .from("customers")
        .insert(fallbackCustomer)
        .select("*")
        .maybeSingle();

      createdCustomer = result.data;
      createError = result.error;
    } catch (insertError) {
      createError = insertError;
    }

    if (createError) {
      console.error("CUSTOMER AUTO-CREATE ERROR:", createError);

      const fallbackRecord = { ...fallbackCustomer };
      delete fallbackRecord.user_id;

      try {
        const legacyResult = await supabase
          .from("customers")
          .insert(fallbackRecord)
          .select("*")
          .maybeSingle();

        if (!legacyResult.error && legacyResult.data) {
          return legacyResult.data;
        }
      } catch (legacyError) {
        console.error("CUSTOMER AUTO-CREATE LEGACY ERROR:", legacyError);
      }

      const { data: byEmail, error: byEmailError } = await supabase
        .from("customers")
        .select("*")
        .ilike("email", fallbackCustomer.email)
        .maybeSingle();

      if (!byEmailError && byEmail) {
        return byEmail;
      }

      return null;
    }

    return createdCustomer;
  } catch (error) {
    console.error("CUSTOMER AUTO-CREATE THROW ERROR:", error);
    return null;
  }
};

const getCustomerRecordForUser = async (user) => {
  if (!user || !user.id) return null;

  const userId = user.id;
  const normalizedEmail = (user.email || "").trim().toLowerCase();

  try {
    let { data: customerByUserId, error: userError } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!userError && customerByUserId) {
      return customerByUserId;
    }
  } catch (columnError) {
    // Fall back to email matching when the older customers schema is active.
  }

  if (normalizedEmail) {
    const { data: customerByEmail, error: emailError } = await supabase
      .from("customers")
      .select("*")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (!emailError && customerByEmail) {
      return customerByEmail;
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profileError && profile) {
    const isCustomerProfile = normalizeRole(profile.role) === "customer" || isCustomerUser(user);
    if (isCustomerProfile) {
      const created = await ensureCustomerRecordForUser(user);
      if (created) {
        return created;
      }
    }
  }

  if (isCustomerUser(user)) {
    const created = await ensureCustomerRecordForUser(user);
    if (created) {
      return created;
    }
  }

  return null;
};

const getDashboard = async (req, res) => {
  try {
    const customer = await getCustomerRecordForUser(req.user);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    const { data: orders, error } = await supabase
      .from("sales_orders")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("CUSTOMER DASHBOARD FETCH ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load dashboard data",
        error: error.message,
      });
    }

    const totalOrders = orders?.length || 0;
    const pendingOrders = orders?.filter((order) => ["pending", "processing"].includes((order.status || "").toLowerCase())).length || 0;
    const productionOrders = orders?.filter((order) => ["production"].includes((order.status || "").toLowerCase())).length || 0;
    const completedOrders = orders?.filter((order) => (order.status || "").toLowerCase() === "completed").length || 0;

    return res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        productionOrders,
        completedOrders,
        recentOrders: (orders || []).slice(0, 5),
      },
    });
  } catch (error) {
    console.error("CUSTOMER DASHBOARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load customer dashboard",
      error: error.message,
    });
  }
};

const normalizeProductStatus = (value) => {
  if (!value) return "active";
  const normalized = String(value).trim().toLowerCase();
  if (["active", "available", "published", "prototype"].includes(normalized)) {
    return normalized;
  }
  return normalized;
};

const isCustomerVisibleProduct = (product) => {
  const status = normalizeProductStatus(product?.status);
  return !["inactive", "archived", "deleted", "discontinued"].includes(status);
};

const isProductOrderable = (product) => {
  const status = normalizeProductStatus(product?.status);
  return ["active", "available", "published", "prototype"].includes(status);
};

const getProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("CUSTOMER PRODUCTS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load products",
        error: error.message,
      });
    }

    const visibleProducts = (data || []).filter(isCustomerVisibleProduct);

    return res.json({ success: true, data: visibleProducts });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load products", error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Missing product id" });
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("CUSTOMER PRODUCT FETCH ERROR:", error);
      return res.status(500).json({ success: false, message: "Failed to load product", error: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (!isCustomerVisibleProduct(data)) {
      return res.status(400).json({ success: false, message: "Product is not available for ordering" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error("GET PRODUCT BY ID ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load product", error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const customer = await getCustomerRecordForUser(req.user);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, department, phone, created_at")
      .eq("id", req.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("CUSTOMER PROFILE ERROR:", profileError);
      return res.status(500).json({ success: false, message: "Failed to load profile", error: profileError.message });
    }

    return res.json({
      success: true,
      data: {
        ...(profile || req.user || {}),
        customer,
      },
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load profile", error: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const customer = await getCustomerRecordForUser(req.user);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found" });
    }

    const { data, error } = await supabase
      .from("sales_orders")
      .select("*, sales_order_items(*, product:products(*))")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("CUSTOMER ORDERS ERROR:", error);
      return res.status(500).json({ success: false, message: "Failed to load orders", error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load orders", error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const customer = await getCustomerRecordForUser(req.user);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Missing order id" });
    }

    const { data, error } = await supabase
      .from("sales_orders")
      .select("*, sales_order_items(*, product:products(*))")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("CUSTOMER ORDER FETCH ERROR:", error);
      return res.status(500).json({ success: false, message: "Failed to load order", error: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (data.customer_id !== customer.id) {
      return res.status(403).json({ success: false, message: "You do not have access to this order" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error("GET ORDER BY ID ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load order", error: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const customer = await getCustomerRecordForUser(req.user);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found" });
    }

    const { items, shipping_address, notes } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one order item is required" });
    }

    const normalizedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (!item || !item.product_id || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
        return res.status(400).json({ success: false, message: "Each item must include a valid product_id and quantity" });
      }

      const productId = item.product_id;
      const quantity = Number(item.quantity);

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (productError || !product) {
        return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
      }

      if (!isProductOrderable(product)) {
        return res.status(400).json({ success: false, message: `Product is not available for ordering: ${product.product_name || productId}` });
      }

      const unitPrice = Number(product.unit_price || 0);
      const lineTotal = unitPrice * quantity;
      totalAmount += lineTotal;

      normalizedItems.push({
        product_id: product.id,
        product_name: product.product_name,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    const orderNumber = `SO-${Date.now().toString().slice(-8)}`;

    const payload = {
      order_number: orderNumber,
      customer_id: customer.id,
      total_amount: Number(totalAmount.toFixed(2)),
      order_date: new Date().toISOString().slice(0, 10),
      status: "pending",
    };

    if (shipping_address) payload.shipping_address = shipping_address;
    if (notes) payload.notes = notes;

    let orderInsert;
    try {
      orderInsert = await supabase
        .from("sales_orders")
        .insert(payload)
        .select()
        .single();
    } catch (error) {
      console.error("SALES ORDER INSERT THROW:", error);
      orderInsert = { error: error };
    }

    if (orderInsert?.error) {
      const message = orderInsert.error?.message || "";
      if (message.includes("shipping_address") || message.includes("notes") || message.includes("column") || message.includes("does not exist")) {
        const fallback = await supabase
          .from("sales_orders")
          .insert({
            order_number: orderNumber,
            customer_id: customer.id,
            total_amount: Number(totalAmount.toFixed(2)),
            order_date: new Date().toISOString().slice(0, 10),
            status: "pending",
          })
          .select()
          .single();

        if (fallback.error) {
          console.error("ORDER FALLBACK ERROR:", fallback.error);
          return res.status(500).json({ success: false, message: "Failed to create order", error: fallback.error.message });
        }

        orderInsert = fallback;
      } else {
        console.error("ORDER INSERT ERROR:", orderInsert.error);
        return res.status(500).json({ success: false, message: "Failed to create order", error: orderInsert.error.message });
      }
    }

    const order = orderInsert.data;

    const orderItems = normalizedItems.map((item) => ({
      sales_order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    }));

    const { error: itemError } = await supabase
      .from("sales_order_items")
      .insert(orderItems);

    if (itemError) {
      console.error("ORDER ITEM INSERT ERROR:", itemError);
      await supabase.from("sales_orders").delete().eq("id", order.id);
      return res.status(500).json({ success: false, message: "Failed to create order items", error: itemError.message });
    }

    const { data: finalOrder } = await supabase
      .from("sales_orders")
      .select("*, sales_order_items(*, product:products(*))")
      .eq("id", order.id)
      .maybeSingle();

    return res.status(201).json({ success: true, data: finalOrder });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to create order", error: error.message });
  }
};

module.exports = {
  getDashboard,
  getProducts,
  getProductById,
  getProfile,
  getOrders,
  getOrderById,
  createOrder,
  getCustomerRecordForUser,
};
