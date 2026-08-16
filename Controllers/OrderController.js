const Order = require("../Models/orderdetails");
const Product = require("../Models/productdb");

// Update Order Status Handler
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // 'Pending', 'Shipped', 'Delivered', 'Cancel'

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const previousStatus = order.status;
    order.status = status;

    // Trigger stock deduction ONLY when changing to 'Shipped' or 'Delivered' for the first time
    if (
      (status === "Shipped" || status === "Delivered") &&
      previousStatus !== "Shipped" &&
      previousStatus !== "Delivered"
    ) {
      const items = order.orderItems || order.items || [];
      
      for (const item of items) {
        const productId = item.product || item._id;
        const qty = Number(item.quantity || item.qty || 1);

        // Atomic stock deduction
        await Product.updateOne(
          { _id: productId, stock: { $gte: qty } },
          { $inc: { stock: -qty } }
        );
      }
    }

    // Restore stock if Order is Cancelled from Shipped/Delivered status
    if (
      status === "Cancel" &&
      (previousStatus === "Shipped" || previousStatus === "Delivered")
    ) {
      const items = order.orderItems || order.items || [];
      for (const item of items) {
        const productId = item.product || item._id;
        const qty = Number(item.quantity || item.qty || 1);

        await Product.updateOne(
          { _id: productId },
          { $inc: { stock: qty } }
        );
      }
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}!`,
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
