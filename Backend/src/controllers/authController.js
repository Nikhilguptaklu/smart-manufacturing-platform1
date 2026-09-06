const { createClient } = require("@supabase/supabase-js");

const getAdminSupabase = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

const register = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      role,
      department
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required"
      });
    }

    const adminSupabase = getAdminSupabase();

    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    const { data: profile, error: profileError } =
      await adminSupabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          full_name,
          email,
          phone: phone || null,
          role: role || "employee",
          department: department || null
        })
        .select()
        .single();

    if (profileError) {
      await adminSupabase.auth.admin.deleteUser(authData.user.id).catch(() => {});

      return res.status(400).json({
        success: false,
        message: profileError.message
      });
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully 🚀",
      user: profile
    });

  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = { register };