const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    material: {
      type: String,
      default: "",
      trim: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // Quantity Wise Pricing
    pricing: {
      type: [pricingSchema],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "At least one pricing option is required.",
      },
    },

    // Product Images
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);