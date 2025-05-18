import express from "express";
import Order from "../models/orderModel.js";
import { protect } from "../middleware/authMiddleware.js";

import {
  checkout,
  getOrders,
  cancelOrder,
  getOrderById,
  generateOrderReport,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";


const router = express.Router();


// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
// router.get('/', protect, getOrders);

// @desc    Checkout and place an order
// @route   POST /api/orders/checkout
// @access  Private
router.post("/checkout", protect, checkout);

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId }).populate("items.product");
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/report", protect, (req, res) => {
  console.log("Handling /report route");
  return generateOrderReport(req, res);
});

// api/orders/order/id
router.get("/order/:id", protect, async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @desc    Get all orders (for storekeeper and cashier)
// @route   GET /api/orders/all
// @access  Private
router.get('/', protect, getAllOrders);

router.get("/:id", protect, getOrderById);

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, cancelOrder);


// @desc    Update order status (for cashier)
// @route   PUT /api/orders/:id/status
// @access  Private
router.put('/:id/status', protect, updateOrderStatus);


export default router;
