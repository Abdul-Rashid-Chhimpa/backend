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

// ======================================================
// CREATE ORDER
// ======================================================
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
      status: "Pending",
      deletedByUser: false,
      casesNumber: 0, // default
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

// ======================================================
// CONFIRM ORDER BY USER (Unlock Bill & Update Status)
// ======================================================
router.put("/confirm/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: "Confirmed",
        deletedByUser: false,
        confirmedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order confirmed successfully and bill unlocked",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Confirm Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// UPDATE CASES / PARCELS NUMBER (Admin sets this)
// ======================================================
router.put("/cases/:id", async (req, res) => {
  try {
    const value = Number(req.body.casesNumber);

    if (!Number.isInteger(value) || value < 0 || value > 9999) {
      return res.status(400).json({
        success: false,
        message: "casesNumber must be an integer between 0 and 9999",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { casesNumber: value },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cases number updated",
      order,
    });
  } catch (error) {
    console.error("Update cases error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// GET ALL ORDERS FOR ADMIN
// ======================================================
router.get(
  "/",
  getAllOrders ||
    (async (req, res) => {
      try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, orders });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    })
);

router.get("/all", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET USER SPECIFIC ACTIVE ORDERS (soft-deleted hide)
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({
      userId,
      deletedByUser: { $ne: true },
    }).sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET SINGLE ORDER PDF INVOICE
router.get("/:orderId/pdf", downloadOrderPDF);

// GET SINGLE ORDER BY ID
router.get("/:id", getOrderById);

// UPDATE STATUS (General/Admin status update)
router.put("/:id", updateOrderStatus);

// ======================================================
// DELETE LOGIC
// ======================================================

// 1. USER SOFT DELETE (hide from user dashboard)
router.put("/user-delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { deletedByUser: true },
      { new: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
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

// 2. ADMIN HARD DELETE
router.delete("/:id", deleteOrder);
router.delete("/delete/:id", deleteOrder);

module.exports = router;
