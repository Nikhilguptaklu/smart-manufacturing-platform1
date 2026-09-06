require("dotenv").config();

const express = require("express");
const cors = require("cors");

const supabase = require("./config/supabase");
const authRoutes = require("./routes/authRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const usersRoutes = require("./routes/usersRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// =============================
// AUTH ROUTES
// =============================
app.use("/api/auth", authRoutes);
// =============================
// BACKEND TEST (PUBLIC)
// =============================
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend connected successfully 🚀"
  });
});

app.use("/api", moduleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/customer", customerRoutes);

// =============================
// SUPABASE TEST
// =============================
app.get("/api/supabase-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, product_code, product_name")
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Supabase connection failed",
        error: error.message
      });
    }

    res.json({
      success: true,
      message: "Supabase connected successfully 🚀",
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// =============================
// PROFILE TEST
// =============================
app.get("/api/profile-test", async (req, res) => {
  try {
    const id = "6aed2381-7759-4d87-b1ca-5dee29e9bc8c";

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id);

    console.log("PROFILE TEST DATA:", data);
    console.log("PROFILE TEST ERROR:", error);

    res.json({
      success: true,
      data,
      error
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =============================
// SERVER
// =============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});