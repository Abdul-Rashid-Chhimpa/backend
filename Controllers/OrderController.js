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
        const productId = item.id || item.productId || item.product || item._id;
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
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/orders/:id (Delete Order Controller)
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
const PDFDocument = require("pdfkit");

// GET /api/orders/:orderId/pdf
exports.downloadOrderPDF = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Database se Order Fetch Karein (Example)
    // const order = await Order.findById(orderId);

    // Sample Dummy Data for testing
    const order = {
      orderId: orderId,
      customerName: "Rahul Sharma",
      totalAmount: 1500,
      items: [{ title: "Product 1", quantity: 2, price: 750 }]
    };

    // 2. Create PDF Stream
    const doc = new PDFDocument({ margin: 30 });

    // Set Headers for Download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice_${order.orderId}.pdf`
    );

    doc.pipe(res);

    // PDF Content Design
    doc.fontSize(20).text("TAX INVOICE", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order.orderId}`);
    doc.text(`Customer Name: ${order.customerName}`);
    doc.moveDown();

    doc.text("--------------------------------------------------");
    order.items.forEach((item) => {
      doc.text(`${item.title} x ${item.quantity} = ₹${item.price * item.quantity}`);
    });
    doc.text("--------------------------------------------------");
    doc.moveDown();
    doc.fontSize(14).text(`Total Amount: ₹${order.totalAmount}`, { bold: true });

    // End Stream
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};
