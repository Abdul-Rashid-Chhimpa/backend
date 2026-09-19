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
      index: true,
    },
    material: {
      type: String,
      default: "",
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    size: {
      type: String,
      default: "",
      trim: true,
    },
    weight: {
      type: String,
      default: "",
      trim: true,
    },
    gst: {
      type: Number,
      default: 0,
      min: [0, "GST cannot be negative"],
      max: [100, "GST percentage cannot exceed 100"],
    },

    // --- OFFERS & DISCOUNTS ---
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, "Discount percentage cannot be negative"],
      max: [100, "Discount percentage cannot exceed 100"],
    },
    discountNote: {
      type: String,
      default: "",
      trim: true,
    },

    // --- BADGE STATUS ---
    isNewProduct: {
      type: Boolean,
      default: true,
    },

    // --- DELIVERY SETTINGS ---
    delivery: {
      minQtyForFreeDelivery: {
        type: Number,
        default: 0,
        min: [0, "Minimum quantity cannot be negative"],
      },
      standardDeliveryCharge: {
        type: Number,
        default: 0,
        min: [0, "Delivery charge cannot be negative"],
      },
      deliveryNote: {
        type: String,
        default: "Free delivery on qualified orders!",
        trim: true,
      },
    },

    // --- PAYMENT METHODS ---
    paymentMethods: {
      cod: { type: Boolean, default: true },
      phonepe: { type: Boolean, default: true },
      gpay: { type: Boolean, default: true },
      paytm: { type: Boolean, default: true },
      card: { type: Boolean, default: true },
      netbanking: { type: Boolean, default: true },
    },

    pricing: {
      type: [pricingSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one pricing option is required.",
      },
    },
    images: {
      type: [String],
      default: [],
    },
    variantGroup: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
