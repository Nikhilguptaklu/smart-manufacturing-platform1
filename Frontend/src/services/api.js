import { supabase } from '@/lib/supabase';

export const API_URL = "http://localhost:5000/api";

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.append(key, String(value));
  });

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export function normalizeListResponse(payload, fallback = []) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return Array.isArray(fallback) ? fallback : [];
}

export function normalizeObjectResponse(payload, fallback = null) {
  if (payload && payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }
  if (payload && payload.profile && typeof payload.profile === "object") {
    return payload.profile;
  }
  if (payload && payload.user && typeof payload.user === "object") {
    return payload.user;
  }
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }
  return fallback;
}

export async function getCurrentAccessToken() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("SESSION FETCH ERROR:", error);
    }

    const currentToken = session?.access_token || localStorage.getItem("access_token");

    if (currentToken) {
      localStorage.setItem("access_token", currentToken);
      return currentToken;
    }
  } catch (error) {
    console.error("SESSION FETCH ERROR:", error);
  }

  return localStorage.getItem("access_token") || null;
}

export async function apiRequest(endpoint, options = {}, tokenOverride = null) {
  const requestToken = tokenOverride || (await getCurrentAccessToken());
  const headers = { Accept: "application/json", ...(options.headers || {}) };

  console.log("API REQUEST:", endpoint);
  console.log("AUTH TOKEN EXISTS:", Boolean(requestToken));

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (requestToken && !options.skipAuth) {
    headers.Authorization = `Bearer ${requestToken}`;
  }

  const requestUrl = `${API_URL}${endpoint}`;

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  console.log("API RESPONSE:", endpoint, response.status);

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    console.error("API ERROR RESPONSE:", endpoint, payload);
    const isUnauthorized = response.status === 401;

    if (isUnauthorized && !options.skipAuth && !options._retried) {
      const freshToken = await getCurrentAccessToken();

      if (freshToken && freshToken !== requestToken) {
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${freshToken}`,
        };

        const retryResponse = await fetch(requestUrl, {
          ...options,
          headers: retryHeaders,
          _retried: true,
        });

        console.log("API RETRY RESPONSE:", endpoint, retryResponse.status);

        const retryContentType = retryResponse.headers.get("content-type") || "";
        const retryPayload = retryContentType.includes("application/json")
          ? await retryResponse.json()
          : await retryResponse.text();

        if (retryResponse.ok) {
          return retryPayload;
        }

        console.error("API RETRY ERROR RESPONSE:", endpoint, retryPayload);
        const retryMessage = retryPayload?.message || retryPayload?.error || "Request failed";
        const retryError = new Error(retryMessage);
        retryError.status = retryResponse.status;
        retryError.payload = retryPayload;
        throw retryError;
      }
    }

    const errorMessage = payload?.message || payload?.error || "Request failed";
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const authApi = {
  login: (payload) => apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  register: (payload) => apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  me: (tokenOverride) => apiRequest("/auth/me", { method: "GET" }, tokenOverride),
};

export const customerApi = {
  getDashboard: () => apiRequest("/customer/dashboard"),
  getProducts: () => apiRequest("/customer/products"),
  getProduct: (id) => apiRequest(`/customer/products/${id}`),
  getProfile: () => apiRequest("/customer/profile"),
  getOrders: () => apiRequest("/customer/orders"),
  getOrder: (id) => apiRequest(`/customer/orders/${id}`),
  createOrder: (payload) => apiRequest("/customer/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
};

export const productsApi = {
  list: (params = {}) => apiRequest(`/products${buildQueryString(params)}`),
  get: (id) => apiRequest(`/products/${id}`),
  create: (payload) => apiRequest("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => apiRequest(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  remove: (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),
};

export const inventoryApi = {
  list: (params = {}) => apiRequest(`/inventory${buildQueryString(params)}`),
  get: (id) => apiRequest(`/inventory/${id}`),
  create: (payload) => apiRequest("/inventory", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => apiRequest(`/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  remove: (id) => apiRequest(`/inventory/${id}`, { method: "DELETE" }),
};

export const customersApi = {
  list: (params = {}) => apiRequest(`/customers${buildQueryString(params)}`),
  create: (payload) => apiRequest("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => apiRequest(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  remove: (id) => apiRequest(`/customers/${id}`, { method: "DELETE" }),
};

export const suppliersApi = {
  list: (params = {}) => apiRequest(`/suppliers${buildQueryString(params)}`),
  create: (payload) => apiRequest("/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => apiRequest(`/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  remove: (id) => apiRequest(`/suppliers/${id}`, { method: "DELETE" }),
};

export const salesOrdersApi = {
  list: (params = {}) => apiRequest(`/sales-orders${buildQueryString(params)}`),
  get: (id) => apiRequest(`/sales-orders/${id}`),
  create: (payload) => apiRequest("/sales-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => apiRequest(`/sales-orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  remove: (id) => apiRequest(`/sales-orders/${id}`, { method: "DELETE" }),
};

export const productionOrdersApi = {
  list: (params = {}) => apiRequest(`/production-orders${buildQueryString(params)}`),
  get: (id) => apiRequest(`/production-orders/${id}`),
  create: (payload) => apiRequest("/production-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => apiRequest(`/production-orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  remove: (id) => apiRequest(`/production-orders/${id}`, { method: "DELETE" }),
};

export const productVersionsApi = {
  list: () => apiRequest("/product-versions"),
  create: (payload) => apiRequest("/product-versions", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => apiRequest(`/product-versions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
};

export const bomsApi = {
  list: () => apiRequest("/boms"),
  get: (id) => apiRequest(`/boms/${id}`),
  create: (payload) => apiRequest("/boms", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => apiRequest(`/boms/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  remove: (id) => apiRequest(`/boms/${id}`, { method: "DELETE" }),
};

export const bomItemsApi = {
  list: (bomId) => apiRequest(`/bom-items?bom_id=${encodeURIComponent(bomId)}`),
  create: (payload) => apiRequest("/bom-items", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  remove: (id) => apiRequest(`/bom-items/${id}`, { method: "DELETE" }),
};

export const componentsApi = {
  list: () => apiRequest("/components"),
  create: (payload) => apiRequest("/components", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => apiRequest(`/components/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  remove: (id) => apiRequest(`/components/${id}`, { method: "DELETE" }),
};

export async function getUsers(accessToken) {
  return apiRequest("/users", {
    method: "GET",
    skipAuth: true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export const usersApi = {
  getUsers,
};

export const dashboardApi = {
  getStats: () => apiRequest("/dashboard/stats"),
  getRecentOrders: () => apiRequest("/dashboard/recent-orders"),
  getProductionSummary: () => apiRequest("/dashboard/production-summary"),
  getInventorySummary: () => apiRequest("/dashboard/inventory-summary"),
  getLowStockItems: () => apiRequest("/dashboard/low-stock-items"),
  getChartData: () => apiRequest("/dashboard/chart-data"),
};

export const apiService = {
  getProducts: (params) => productsApi.list(params),
  createProduct: (payload) => productsApi.create(payload),
  updateProduct: (id, payload) => productsApi.update(id, payload),
  deleteProduct: (id) => productsApi.remove(id),
  getInventory: (params) => inventoryApi.list(params),
  createInventory: (payload) => inventoryApi.create(payload),
  updateInventory: (id, payload) => inventoryApi.update(id, payload),
  deleteInventory: (id) => inventoryApi.remove(id),
  getCustomers: (params) => customersApi.list(params),
  createCustomer: (payload) => customersApi.create(payload),
  updateCustomer: (id, payload) => customersApi.update(id, payload),
  deleteCustomer: (id) => customersApi.remove(id),
  getSuppliers: (params) => suppliersApi.list(params),
  createSupplier: (payload) => suppliersApi.create(payload),
  updateSupplier: (id, payload) => suppliersApi.update(id, payload),
  deleteSupplier: (id) => suppliersApi.remove(id),
  getSalesOrders: (params) => salesOrdersApi.list(params),
  createSalesOrder: (payload) => salesOrdersApi.create(payload),
  updateSalesOrder: (id, payload) => salesOrdersApi.update(id, payload),
  deleteSalesOrder: (id) => salesOrdersApi.remove(id),
  getProductionOrders: (params) => productionOrdersApi.list(params),
  createProductionOrder: (payload) => productionOrdersApi.create(payload),
  updateProductionOrder: (id, payload) => productionOrdersApi.update(id, payload),
  deleteProductionOrder: (id) => productionOrdersApi.remove(id),
  getProductVersions: (params) => productVersionsApi.list(params),
  getComponents: (params) => componentsApi.list(params),
  getBoms: (params) => bomsApi.list(params),
};
