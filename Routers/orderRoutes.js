const express = require("express");
const router = express.Router();
const Order = require("../Models/orderdetails");

// Controllers import karein (path aur casing exact honi chahiye)
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

// ================= GET ALL ORDERS (MAIN ROUTE FIX FOR BILLS) =================
// Ye Dono Routes Rakh Diye Hain Taaki Frontend /api/orders aur /api/orders/all dono par kaam kare
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

// UPDATE STATUS (Stock decrement/increment)
router.put("/:id", updateOrderStatus);

// DELETE ORDER (Both /:id and /delete/:id paths)
router.delete("/:id", deleteOrder);
router.delete("/delete/:id", deleteOrder);

module.exports = router;
