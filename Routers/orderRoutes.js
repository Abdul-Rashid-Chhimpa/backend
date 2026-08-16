const express = require("express");
const router = express.Router();
const Order = require("../Models/orderdetails");

// Import controllers
const {
  updateOrderStatus,
  deleteOrder,
} = require("../Controllers/OrderController"); // Ensure path to your controller file is correct

// CREATE ORDER
router.post("/create", async (req, res) => {
  try {
    console.log(req.body);

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
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET ALL ORDERS (ADMIN PANEL)
router.get("/all", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// UPDATE STATUS (Stock decrement/increment logic ke saath)
router.put("/:id", updateOrderStatus);

// DELETE ORDER (Permanent delete route)
router.delete("/:id", deleteOrder);

// Express Route (e.g., /api/orders/delete/:id)
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB Mongoose Delete Query
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found in database",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to delete order",
      error: error.message,
    });
  }
});

module.exports = router;
