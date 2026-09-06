const express = require("express");

const login = require("../controllers/loginController");
const register = require("../controllers/registerController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "AUTH ROUTES WORKING 🚀"
  });
});

router.post("/register", register);

router.post("/login", login);

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "User authenticated successfully 🚀",
    user: req.user
  });
});

router.get(
  "/admin-test",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Admin access granted 🚀",
      role: req.userRole
    });
  }
);

module.exports = router;