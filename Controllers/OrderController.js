const Order = require("../Models/orderdetails");
const Product = require("../Models/productdb");

// PUT /api/orders/:id
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Pending', 'Shipped', 'Delivered', 'Cancelled'

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const prevStatus = order.status;
    order.status = status;

    // 1. Stock Decrement when Status changes to Shipped/Delivered
    if (
      (status === "Shipped" || status === "Delivered") &&
      prevStatus !== "Shipped" &&
      prevStatus !== "Delivered"
    ) {
      const items = order.items || order.orderItems || [];
      for (const item of items) {
        const productId = item.productId || item.product || item._id;
        const qty = Number(item.quantity || item.qty || 1);

        if (productId) {
          await Product.findByIdAndUpdate(productId, {
            $inc: { stock: -qty },
          });
        }
      }
    }

    // 2. Restore Stock if Order is Cancelled after being Shipped/Delivered
    if (
      status === "Cancelled" &&
      (prevStatus === "Shipped" || prevStatus === "Delivered")
    ) {
      const items = order.items || order.orderItems || [];
      for (const item of items) {
        const productId = item.productId || item.product || item._id;
        const qty = Number(item.quantity || item.qty || 1);

        if (productId) {
          await Product.findByIdAndUpdate(productId, {
            $inc: { stock: qty },
          });
        }
      }
    }

    const updatedOrder = await order.save();
    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
