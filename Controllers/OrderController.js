// orderController.js
const Product = require("../Models/productdb"); // Aapka Product Model
const Order = require("../Models/orderdetails"); // Aapka Order Model

exports.createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items found" });
    }

    // 1. Check & Update Stock for Each Product dynamically
    for (const item of orderItems) {
      const product = await Product.findById(item.product || item._id);

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }

      // Read current stock dynamically
      const currentStock = Number(product.stock ?? product.countInStock ?? product.quantity ?? 0);

      // Check if enough stock is available
      if (currentStock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Only ${currentStock} left!`,
        });
      }

      // Decrement stock dynamically
      product.stock = currentStock - Number(item.quantity);
      
      // Update countInStock / quantity if your schema uses those field names
      if (product.countInStock !== undefined) product.countInStock = product.stock;
      if (product.quantity !== undefined) product.quantity = product.stock;

      await product.save();
    }

    // 2. Save New Order
    const newOrder = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      isPaid: true,
      paidAt: Date.now(),
    });

    const createdOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order placed and stock updated successfully!",
      order: createdOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
