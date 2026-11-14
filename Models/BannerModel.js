const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "Banner image URL is required"],
    },
    tagline: {
      type: String,
      required: [true, "Tagline is required"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    specs: {
      type: String,
      required: [true, "Specifications are required"],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
