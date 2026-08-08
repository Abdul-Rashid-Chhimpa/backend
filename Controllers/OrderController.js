const Order = require("../models/Order");
const Product = require("../models/Product"); // Path Sahi Rakhein

exports.createOrder = async (req, res) => {
  try {
    // 1. Order save karein
    const order = await Order.create(req.body);

    // 2. Body me se items array find karein (Multiple Key Support)
    const items =
      req.body.orderItems ||
      req.body.items ||
      req.body.products ||
      req.body.cartItems ||
      [];

    // Debugging Console (Backend Terminal me dekhein ki kya print ho raha hai)
    console.log("Order Items Received:", items);

    // 3. Stock Reduce Loop
    for (const item of items) {
      // Product ID extract karein
      const productId =
        item.product?._id ||
        item.product ||
        item.productId ||
        item._id ||
        item.id;

      // Quantity extract karein (Aapke UI me Qty: 250 dikh rha hai)
      const quantity = Number(
        item.quantity || item.qty || item.count || 1
      );

      console.log(`Updating Product: ${productId}, Decreasing Stock By: ${quantity}`);

      if (productId) {
        // Database update command
        const updatedProd = await Product.findByIdAndUpdate(
          productId,
          { $inc: { stock: -quantity } }, // Stock 250 se ghat jayega
          { new: true }
        );

        console.log("Updated Stock Result:", updatedProd?.stock);
      }
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
