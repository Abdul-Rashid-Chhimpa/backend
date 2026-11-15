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
    
    // Main gallery images (Cloudinary URLs)
    images: [{ type: String, required: true }],
    
    // 360-Degree Sequence Frames (Cloudinary URLs in order)
    frames360: [{ type: String }],
    is360Enabled: { type: Boolean, default: true },
    
    // Technical Specs for Product Details
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

// ✅ FIX: Check if model already exists before compiling
module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
