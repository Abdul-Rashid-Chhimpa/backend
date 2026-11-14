const mongoose = require("mongoose");

const MAX_BANNERS = 5;

const bannerSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    tagline: { type: String, default: "" },
    title: { type: String, default: "" },
    specs: { type: String, default: "" },
    link: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Safety net: 5 se zyada banner save nahi honge
bannerSchema.pre("save", async function () {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count >= MAX_BANNERS) {
      throw new Error(`Maximum ${MAX_BANNERS} banners allowed. Pehle koi purana banner delete karein.`);
    }
  }
});

module.exports = mongoose.model("Banner", bannerSchema);
