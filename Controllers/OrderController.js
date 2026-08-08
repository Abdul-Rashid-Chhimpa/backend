const Order = require("../models/Order");
const Product = require("../models/Product"); // 1. Product Model Import karein

exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // 2. Order items me se har product ka stock kam karein
    // Note: Verify karein req.body.orderItems hai ya req.body.items
    const items = req.body.orderItems || req.body.items || [];

    for (const item of items) {
      // product / productId field check karein
      const productId = item.product || item.productId || item._id;
      const quantity = Number(item.quantity || item.qty || 1);

      if (productId) {
        await Product.findByIdAndUpdate(productId, {
          $inc: { stock: -quantity }, // stock ko quantity ke barabar kam karega
        });
      }
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
