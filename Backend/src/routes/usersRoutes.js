const express = require("express");
const { createSupabaseClient } = require("../config/supabase");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, department, phone, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("GET USERS ERROR:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch users",
          error: error.message,
        });
      }

      return res.json({
        success: true,
        data: data || [],
      });
    } catch (error) {
      console.error("USERS ROUTE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: error.message,
      });
    }
  }
);

module.exports = router;
