const Order = require("../Models/orderdetails");
const Product = require("../Models/productdb");

// Order Status Update Route Handler (Admin Panel "Delivered" Click)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Pehle se Delivered toh dubara stock kam na ho
    if (order.status === "Delivered") {
      return res.status(400).json({ success: false, message: "Order is already delivered" });
    }

    // Status ko Delivered mark karein
    order.status = status || "Delivered";
    await order.save();

    // Jab Status "Delivered" ho jaye tabhi stock reduce hoga
    if (status === "Delivered") {
      const items = order.orderItems || order.items || order.products || [];

      for (const item of items) {
        const productId = item.product?._id || item.product || item.productId || item._id;
        const quantity = Number(item.quantity || item.qty || 1);

        if (productId) {
          await Product.findByIdAndUpdate(productId, {
            $inc: { stock: -quantity }, // Stock kam kar dega
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Order status updated and stock reduced successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
