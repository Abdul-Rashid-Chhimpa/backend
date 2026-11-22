const mongoose = require("mongoose");

const pricingTierSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
  },
  { _id: false }
);

const specItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: "",
    },
    value: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const product3DSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    brand: {
      type: String,
      default: "Pedwal",
      trim: true,
    },
    tagline: {
      type: String,
      default: "Industrial Grade Precision Tool",
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    // MRP & Selling Price
    price: {
      type: Number,
      required: [true, "MRP price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Selling price cannot be negative"],
      default: null,
    },
    discountPercent: {
      type: Number,
      min: [0, "Discount percentage cannot be negative"],
      max: [100, "Discount percentage cannot exceed 100"],
      default: 0,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    material: {
      type: String,
      default: "Chrome Vanadium Steel",
      trim: true,
    },
    warranty: {
      type: String,
      default: "5 Years Replacement Warranty",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Draft", "Hidden"],
      default: "Active",
      index: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 10,
      min: [0, "Stock cannot be negative"],
    },

    pricing: {
      type: [pricingTierSchema],
      default: [],
    },

    images: {
      type: [String],
      required: [true, "At least one main product image is required"],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one main product image is required",
      },
    },
    frames360: {
      type: [String],
      default: [],
    },
    is360Enabled: {
      type: Boolean,
      default: false,
    },

    specs: {
      type: [specItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Async pre-save hook (no `next` callback for Mongoose 9 compatibility)
product3DSchema.pre("save", async function () {
  const mrp = Number(this.price) || 0;

  if (this.discountPrice === null || this.discountPrice === undefined) {
    this.discountPrice = mrp;
  }

  const effectivePrice =
    typeof this.discountPrice === "number" && !Number.isNaN(this.discountPrice)
      ? this.discountPrice
      : mrp;

  if (mrp > 0 && effectivePrice < mrp) {
    this.discountPercent = Math.max(
      0,
      Math.min(100, Math.round(((mrp - effectivePrice) / mrp) * 100))
    );
  } else if (this.discountPercent === undefined || this.discountPercent === null) {
    this.discountPercent = 0;
  }

  if (!Array.isArray(this.pricing) || this.pricing.length === 0) {
    this.pricing = [{ quantity: 1, price: effectivePrice }];
  }

  this.is360Enabled = Array.isArray(this.frames360) && this.frames360.length > 0;
});

module.exports =
  mongoose.models.Product3D || mongoose.model("Product3D", product3DSchema);
