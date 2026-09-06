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
            email,
            password,
            full_name,
            phone,
            department
        } = req.body;

        if (!email || !password || !full_name || !phone || !department) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const adminSupabase = getAdminSupabase();

        const { data: authData, error: authError } =
            await adminSupabase.auth.admin.createUser({
                email: email.trim(),
                password,
                email_confirm: true
            });

        if (authError) {
            console.error("AUTH CREATE ERROR:", authError);

            return res.status(400).json({
                success: false,
                message: authError.message
            });
        }

        const userId = authData.user.id;

        const { data: profile, error: profileError } =
            await adminSupabase
                .from("profiles")
                .insert({
                    id: userId,
                    full_name: full_name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    role: "employee",
                    department: department
                })
                .select()
                .single();

        if (profileError) {
            console.error("PROFILE INSERT ERROR:", profileError);

            await adminSupabase.auth.admin.deleteUser(userId).catch(() => {});

            return res.status(500).json({
                success: false,
                message: "Failed to create user profile",
                error: profileError.message
            });
        }

        return res.status(201).json({
            success: true,
            message: "Registration successful 🚀",
            user: profile
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = register;