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
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

  status: {
    type: String,
    enum: ["Pending", "Order Confirmed", "Shipped", "Delivered", "Cancelled"], // Add "Order Confirmed" here
    default: "Pending",
  },

    // User soft-delete tracking flag
    deletedByUser: {
      type: Boolean,
      default: false,
    },

    // Optional: Confirmation timestamp track karne ke liye
    confirmedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
