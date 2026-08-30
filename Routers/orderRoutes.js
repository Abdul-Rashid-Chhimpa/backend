const express = require("express");
const router = express.Router();
const Order = require("../Models/orderdetails");

// Controllers import
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  downloadOrderPDF,
} = require("../Controllers/OrderController");

// CREATE ORDER
router.post("/create", async (req, res) => {
  try {
    const { userId, customerName, items, totalAmount } = req.body;

    if (
      !userId ||
      !customerName ||
      !items ||
      items.length === 0 ||
      !totalAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const order = await Order.create({
      userId,
      customerName,
      items,
      totalAmount,
    });

    res.status(201).json({
      success: true,
      message: "Order Created Successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET ALL ORDERS FOR ADMIN (Returns ALL records including soft deleted)
router.get("/", getAllOrders || (async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

router.get("/all", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET SINGLE ORDER PDF INVOICE
router.get("/:orderId/pdf", downloadOrderPDF);

// GET SINGLE ORDER BY ID
router.get("/:id", getOrderById);

// UPDATE STATUS
router.put("/:id", updateOrderStatus);

// ================= DELETE LOGIC FIX =================

// 1. USER SOFT DELETE ROUTE (Hides bill from user screen, keeps in Admin database)
router.put("/user-delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { deletedByUser: true },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      message: "Order hidden from user dashboard",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. ADMIN HARD DELETE ROUTE (Removes record completely)
router.delete("/:id", deleteOrder);
router.delete("/delete/:id", deleteOrder);

module.exports = router;
