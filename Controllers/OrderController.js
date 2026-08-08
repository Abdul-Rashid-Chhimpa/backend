const Order = require("../Models/orderdetails");
const Product = require("../Models/productdb");

// Order Status Update Route Handler (Admin Panel "Delivered" Click)

exports.createOrder = async (req, res) => {
  try {
    const { orderItems, items, products } = req.body;
    
    // Safety Array Check
    const cartItems = orderItems || items || products || [];

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "No items in order" });
    }

    // 1. Order Save Karein
    const order = await Order.create(req.body);

    // 2. Buy karte hi stock minus karein
    for (const item of cartItems) {
      const productId = item.product?._id || item.product || item.productId || item._id;
      const quantity = Number(item.quantity || item.qty || 1);

      if (productId) {
        await Product.findByIdAndUpdate(productId, {
          $inc: { stock: -quantity } // Automatically stock reduce kar dega
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Order placed and stock updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
