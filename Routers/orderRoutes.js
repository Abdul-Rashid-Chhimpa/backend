const express = require("express");
const router = express.Router();
const Order = require("../Models/orderdetails");

// CREATE ORDER
router.post("/create", async (req, res) => {
  try {
    console.log(req.body);

    const {
      userId,
      customerName,
      items,
      totalAmount,
    } = req.body;

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
    res.status(500).json(error);
  }
});

// UPDATE STATUS
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
