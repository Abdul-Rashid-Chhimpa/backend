const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: "Industrial Grade Precision Tool" },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    category: { type: String, required: true, index: true },
    material: { type: String, default: "Chrome Vanadium Steel" },
    warranty: { type: String, default: "5 Years Replacement Warranty" },
    
    status: { 
      type: String, 
      enum: ["Active", "Draft", "Hidden"], 
      default: "Active",
      index: true 
    },
    
    images: [{ type: String, required: true }],
    frames360: [{ type: String }],
    is360Enabled: { type: Boolean, default: true },
    
    specs: [
      {
        label: String,
        value: String,
      },
    ],
    stock: { type: Number, default: 10 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
