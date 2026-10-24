const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    items: [
      {
        id: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        image: String,
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        // optional – invoice / GST ke liye useful
        gst: {
          type: Number,
          default: 0,
        },
        hsnCode: {
          type: String,
          default: "",
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Order Confirmed",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    // --- CASES / PARCELS (admin sets in AdminBills) ---
    casesNumber: {
      type: Number,
      default: 0,
      min: [0, "Cases number cannot be negative"],
    },

    // Optional: invoice serial store karna ho to
    invoiceNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // User soft-delete tracking flag
    deletedByUser: {
      type: Boolean,
      default: false,
    },

    // Confirmation timestamp
    confirmedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
