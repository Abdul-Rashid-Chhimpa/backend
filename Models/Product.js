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

const specSchema = new mongoose.Schema(
  {
    key: { type: String, trim: true, default: "" },
    value: { type: String, trim: true, default: "" },
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
    tagline: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "draft", "inactive"],
      default: "active",
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

    // --- PRICING (supports MRP, Selling Price, top-level price & tiered pricing) ---
    mrp: {
      type: Number,
      min: [0, "MRP cannot be negative"],
      default: null,
    },
    sellingPrice: {
      type: Number,
      min: [0, "Selling price cannot be negative"],
      default: null,
    },
    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
      default: null,
    },
    pricing: {
      type: [pricingSchema],
      default: [],
      validate: {
        validator: function (value) {
          const hasPricingArray = Array.isArray(value) && value.length > 0;
          const hasDirectPrice =
            typeof this.sellingPrice === "number" ||
            typeof this.price === "number" ||
            typeof this.mrp === "number";
          return hasPricingArray || hasDirectPrice;
        },
        message: "At least one price or pricing option is required.",
      },
    },

    // --- SPECS ---
    specs: {
      type: [specSchema],
      default: [],
    },

    // --- GST ---
    gst: {
      type: Number,
      default: 0,
      min: [0, "GST cannot be negative"],
      max: [100, "GST percentage cannot exceed 100"],
    },

    // --- HSN CODE (invoice) ---
    hsnCode: {
      type: String,
      default: "",
      trim: true,
      match: [/^\d{0,8}$/, "HSN code must contain only digits (max 8)"],
    },

    // --- SPECIAL / SELECTED USER OFFERS & DISCOUNTS ---
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

    // --- DISCOUNT FOR ALL OTHER USERS (NOT SELECTED) ---
    otherUsersDiscountPercent: {
      type: Number,
      default: 0,
      min: [0, "Other users discount percentage cannot be negative"],
      max: [100, "Other users discount percentage cannot exceed 100"],
    },
    otherUsersDiscountNote: {
      type: String,
      default: "",
      trim: true,
    },

    // --- USER TARGETED DISCOUNT ---
    discountTargetType: {
      type: String,
      enum: ["all", "selected"],
      default: "all",
    },
    allowedUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

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
      charge: {
        type: Number,
        default: 0,
        min: [0, "Delivery charge cannot be negative"],
      },
      deliveryNote: {
        type: String,
        default: "Free delivery on qualified orders!",
        trim: true,
      },
      time: {
        type: String,
        default: "",
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

    // --- IMAGES & 360° ROTATION FRAMES ---
    images: {
      type: [String],
      default: [],
    },
    rotationFrames: {
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

// Keep price, sellingPrice, pricing[0].price, and delivery.charge in sync
productSchema.pre("save", async function () {
  // 1. Resolve effective price from sellingPrice, price, mrp, or pricing[0]
  const firstTierPrice =
    Array.isArray(this.pricing) && this.pricing.length > 0
      ? this.pricing[0].price
      : null;

  const effectivePrice =
    typeof this.sellingPrice === "number" && !Number.isNaN(this.sellingPrice)
      ? this.sellingPrice
      : typeof this.price === "number" && !Number.isNaN(this.price)
      ? this.price
      : typeof firstTierPrice === "number" && !Number.isNaN(firstTierPrice)
      ? firstTierPrice
      : typeof this.mrp === "number" && !Number.isNaN(this.mrp)
      ? this.mrp
      : 0;

  this.price = effectivePrice;
  if (this.sellingPrice === null || this.sellingPrice === undefined) {
    this.sellingPrice = effectivePrice;
  }
  if (this.mrp === null || this.mrp === undefined) {
    this.mrp = effectivePrice;
  }

  // Ensure pricing array always has at least one entry so older code reading pricing[0].price works
  if (!Array.isArray(this.pricing) || this.pricing.length === 0) {
    this.pricing = [{ quantity: 1, price: effectivePrice }];
  } else if (
    this.isModified("sellingPrice") ||
    this.isModified("price")
  ) {
    this.pricing[0].price = effectivePrice;
  }

  // 2. Sync delivery charge
  if (
    this.delivery &&
    (this.delivery.charge === undefined || this.delivery.charge === null)
  ) {
    this.delivery.charge = this.delivery.standardDeliveryCharge || 0;
  }
  if (
    this.delivery &&
    this.isModified("delivery.standardDeliveryCharge") &&
    !this.isModified("delivery.charge")
  ) {
    this.delivery.charge = this.delivery.standardDeliveryCharge || 0;
  }
});

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
