const Product = require("../Models/productdb");
const Order = require("../Models/orderdetails");

exports.createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: "No items found in order" });
    }

    // 1. Pre-check Stock Availability
    for (const item of orderItems) {
      const productId = item.product || item._id;
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.name || "Unknown Product"}`,
        });
      }

      const requestedQty = Number(item.quantity || item.qty || 1);
      if (product.stock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} items left!`,
        });
      }
    }

    // 2. Atomically Decrement Stock in Database
    for (const item of orderItems) {
      const productId = item.product || item._id;
      const requestedQty = Number(item.quantity || item.qty || 1);

      await Product.updateOne(
        { _id: productId, stock: { $gte: requestedQty } },
        { $inc: { stock: -requestedQty } }
      );
    }

    // 3. Create & Save Order
    const order = new Order({
      user: req.user?._id || req.body.userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      isPaid: paymentMethod === "Online" || paymentMethod === "Card",
      paidAt: paymentMethod === "Online" ? Date.now() : null,
    });

    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully! Stock updated dynamically.",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
