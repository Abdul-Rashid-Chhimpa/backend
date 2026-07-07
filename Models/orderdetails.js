const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: String,
    customerName: String,

    items: [
      {
        id: Number,
        title: String,
        image: String,
        price: Number,
        quantity: Number,
      },
    ],

    totalAmount: Number,

    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);