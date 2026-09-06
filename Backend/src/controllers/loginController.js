const { createSupabaseClient } = require("../config/supabase");

const normalizeRole = (role) => {
  const raw = String(role || "employee").trim().toLowerCase();
  return ["admin", "manager", "engineer", "employee", "customer"].includes(raw) ? raw : "employee";
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
  const profilePayload = {
    id: authUser.id,
    email,
    full_name: fallbackName,
    phone: metadata.phone || null,
    role,
    department: metadata.department || null,
  };

  const { data, error } = await supabaseClient
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("PROFILE UPSERT ERROR:", error);
    return {
      id: authUser.id,
      email,
      full_name: fallbackName,
      role,
      department: metadata.department || null,
      phone: metadata.phone || null,
    };
  }

  return data || profilePayload;
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const supabase = createSupabaseClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (authError) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const userId = authData.user.id;

    let profile = null;
    const { data: existingProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
      console.error("PROFILE QUERY ERROR:", profileError);
    }

    profile = existingProfile || (await ensureProfileForUser(supabase, authData.user));

    const fallbackProfile = {
      id: userId,
      email: authData.user.email || email,
      full_name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || email.split("@")[0],
      role: normalizeRole(authData.user.user_metadata?.role || authData.user.role || "employee"),
      department: authData.user.user_metadata?.department || null,
      phone: authData.user.user_metadata?.phone || null,
    };

    const resolvedProfile = profile || fallbackProfile;
    const accessToken = authData.session?.access_token || null;

    return res.status(200).json({
      success: true,
      message: "Login successful 🚀",
      user: resolvedProfile,
      access_token: accessToken,
      token: accessToken,
      session: authData.session
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = login;