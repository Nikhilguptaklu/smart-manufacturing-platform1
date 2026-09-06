const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getDashboard,
  getProducts,
  getProductById,
  getProfile,
  getOrders,
  getOrderById,
  createOrder,
} = require("../controllers/customerController");

const router = express.Router();

router.get("/dashboard", authMiddleware, roleMiddleware("customer"), getDashboard);
router.get("/products", authMiddleware, roleMiddleware("customer"), getProducts);
router.get("/products/:id", authMiddleware, roleMiddleware("customer"), getProductById);
router.get("/profile", authMiddleware, roleMiddleware("customer"), getProfile);
router.get("/orders", authMiddleware, roleMiddleware("customer"), getOrders);
router.get("/orders/:id", authMiddleware, roleMiddleware("customer"), getOrderById);
router.post("/orders", authMiddleware, roleMiddleware("customer"), createOrder);

module.exports = router;
