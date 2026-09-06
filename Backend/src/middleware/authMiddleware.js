const { createClient } = require("@supabase/supabase-js");
const { createSupabaseClient } = require("../config/supabase");

const normalizeRole = (role) => {
  if (!role) return "employee";

  const normalized = String(role).trim().toLowerCase();
  if (["admin", "manager", "engineer", "employee", "customer"].includes(normalized)) {
    return normalized;
  }

  return "employee";
};

const ensureProfileForUser = async (supabaseClient, authUser) => {
  if (!authUser || !authUser.id) {
    return null;
  }

  const metadata = authUser.user_metadata || {};
  const email = authUser.email || "";
  const fallbackName =
    metadata.full_name ||
    metadata.name ||
    (email ? email.split("@")[0] : "User") ||
    "User";

  const role = normalizeRole(metadata.role || authUser.role || "employee");

  const { data, error } = await supabaseClient
    .from("profiles")
    .upsert(
      {
        id: authUser.id,
        email,
        full_name: fallbackName,
        phone: metadata.phone || null,
        role,
        department: metadata.department || null,
      },
      { onConflict: "id" }
    )
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("PROFILE UPSERT ERROR:", error);
    return null;
  }

  return data;
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("AUTH MIDDLEWARE: Missing Authorization header", {
        endpoint: req.originalUrl,
        method: req.method,
      });

      return res.status(401).json({
        success: false,
        message: "Access token required"
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      console.error("AUTH MIDDLEWARE: Empty bearer token", {
        endpoint: req.originalUrl,
        method: req.method,
      });

      return res.status(401).json({
        success: false,
        message: "Access token required"
      });
    }

    const supabase = createSupabaseClient();

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.error("AUTH MIDDLEWARE: Invalid or expired token", {
        endpoint: req.originalUrl,
        method: req.method,
        status: 401,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    const userId = data.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("AUTH MIDDLEWARE: Profile fetch failed", {
        endpoint: req.originalUrl,
        method: req.method,
        status: 500,
        message: profileError.message,
      });

      return res.status(500).json({
        success: false,
        message: "Failed to fetch user profile"
      });
    }

    const resolvedProfile = profile || (await ensureProfileForUser(supabase, data.user));

    if (!resolvedProfile) {
      console.error("AUTH MIDDLEWARE: User profile not found", {
        endpoint: req.originalUrl,
        method: req.method,
        status: 404,
        userId,
      });

      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    req.user = resolvedProfile;
    next();

  } catch (error) {
    console.error("AUTH MIDDLEWARE: Authentication failed", {
      endpoint: req.originalUrl,
      method: req.method,
      status: 500,
      message: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

module.exports = authMiddleware;