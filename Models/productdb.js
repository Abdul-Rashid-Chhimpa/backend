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
    
    // 1. DELIVERY CHARGE FIELD ADDED
// ProductSchema mein delivery ko object structure dein
delivery: {
  charge: {
    type: Number,
    default: 150,
    min: [0, "Delivery charge cannot be negative"],
  },
  time: {
    type: String,
    default: "3-5 business days",
    trim: true,
  },
},

    // 2. PAYMENT METHODS FIELD ADDED
   paymentMethods: {
  type: [String],
  enum: [
    "Cash on Delivery", 
    "UPI / Online Payment", 
    "Credit / Debit Card", 
    "Net Banking",
    "upi", 
    "card", 
    "cod", 
    "netbanking"
  ],
  default: ["Cash on Delivery", "UPI / Online Payment"],
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
