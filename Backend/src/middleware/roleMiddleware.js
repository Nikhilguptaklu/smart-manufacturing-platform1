const { createClient } = require("@supabase/supabase-js");

const normalizeRole = (role) => {
  if (!role) return "employee";

  const normalized = String(role).trim().toLowerCase();

  if (["admin", "manager", "engineer", "employee", "customer"].includes(normalized)) {
    return normalized;
  }

  return "employee";
};

const createMissingProfile = async (user) => {
  if (!user || !user.id) {
    return null;
  }

  const adminSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const email = user.email || "";
  const fullName =
    user.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (email ? email.split("@")[0] : "User") ||
    "User";

  const role = normalizeRole(user.role || user.user_metadata?.role || "employee");

  const { data, error } = await adminSupabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        full_name: fullName,
        phone: user.phone || user.user_metadata?.phone || null,
        role,
        department: user.department || user.user_metadata?.department || null,
      },
      { onConflict: "id" }
    )
    .select("role, id, email, full_name")
    .maybeSingle();

  if (error) {
    console.error("PROFILE ROLE FALLBACK ERROR:", error);
    return null;
  }

  return data;
};

const { createSupabaseClient } = require("../config/supabase");

const roleMiddleware = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }

      const supabase = createSupabaseClient();

      let { data: profile, error } = await supabase
        .from("profiles")
        .select("role, id, email, full_name")
        .eq("id", req.user.id)
        .maybeSingle();

      if (error) {
        console.error("PROFILE ROLE FETCH ERROR:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to verify user role"
        });
      }

      if (!profile) {
        const created = await createMissingProfile(req.user);
        if (!created) {
          return res.status(500).json({
            success: false,
            message: "Unable to create missing user profile"
          });
        }
        profile = created;
      }

      const resolvedRole = normalizeRole(profile.role);
      const allowedSet = new Set(allowedRoles.map((value) => String(value).trim().toLowerCase()));

      if (!allowedSet.has(resolvedRole)) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }

      req.userRole = resolvedRole;
      next();

    } catch (error) {
      console.error("ROLE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Role verification failed"
      });
    }
  };
};

module.exports = roleMiddleware;
module.exports.normalizeRole = normalizeRole;