const Order = require("../Models/orderdetails");
const Product = require("../Models/productdb");
const PDFDocument = require("pdfkit");

// ================= 1. GET ALL ORDERS / BILLS (MISSING THA) =================
// GET /api/orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders/bills",
      error: error.message,
    });
  }
};

// ================= 2. GET SINGLE ORDER DETAILS =================
// GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email phone");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================= 3. UPDATE ORDER STATUS =================
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

    // Stock Decrement when Status changes to Shipped/Delivered
    if (
      (status === "Shipped" || status === "Delivered") &&
      prevStatus !== "Shipped" &&
      prevStatus !== "Delivered"
    ) {
      const items = order.items || order.orderItems || [];
      for (const item of items) {
        const productId = item.id || item.productId || item.product || item._id;
        const qty = Number(item.quantity || item.qty || 1);

        if (productId) {
          await Product.findByIdAndUpdate(productId, {
            $inc: { stock: -qty },
          });
        }
      }
    }

    // Restore Stock if Order is Cancelled
    if (
      status === "Cancelled" &&
      (prevStatus === "Shipped" || prevStatus === "Delivered")
    ) {
      const items = order.items || order.orderItems || [];
      for (const item of items) {
        const productId = item.id || item.productId || item.product || item._id;
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
    console.error("Update Status Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================= 4. DELETE ORDER =================
// DELETE /api/orders/:id
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      orderId: id,
    });
  } catch (error) {
    console.error("Delete Order Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete order",
    });
  }
};

// ================= 5. DOWNLOAD PDF INVOICE (REAL DATA FIX) =================
// GET /api/orders/:orderId/pdf
exports.downloadOrderPDF = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Real DB order fetch
    const order = await Order.findById(orderId).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found for PDF" });
    }

    const doc = new PDFDocument({ margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice_${order._id}.pdf`
    );

    doc.pipe(res);

    // Header
    doc.fontSize(20).text("TAX INVOICE", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: #${order._id}`);
    doc.text(`Customer Name: ${order.user?.name || order.shippingAddress?.fullName || "Guest Customer"}`);
    doc.text(`Payment Method: ${order.paymentMethod || "COD"}`);
    doc.moveDown();

    doc.text("--------------------------------------------------");
    const items = order.items || order.orderItems || [];
    items.forEach((item) => {
      const name = item.name || item.title || "Product";
      const qty = item.quantity || item.qty || 1;
      const price = item.price || 0;
      doc.text(`${name} x ${qty} = ₹${price * qty}`);
    });
    doc.text("--------------------------------------------------");
    doc.moveDown();

    const total = order.totalPrice || order.grandTotal || 0;
    doc.fontSize(14).text(`Total Amount: ₹${total}`, { bold: true });

    doc.end();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ message: "Failed to generate PDF invoice" });
  }
};


// User Delete Route / Controller Handler
exports.deleteUserOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Hard delete (findByIdAndDelete) ki jagah Soft Delete kijiye:
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { deletedByUser: true },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order hidden from user dashboard" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
