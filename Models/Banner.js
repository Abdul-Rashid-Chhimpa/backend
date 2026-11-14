const mongoose = require("mongoose");

const MAX_BANNERS = 5;

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    image: { type: String, required: true },
    link: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Safety net: 5 se zyada banner database me save nahi honge
bannerSchema.pre("save", async function () {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count >= MAX_BANNERS) {
      throw new Error(`Maximum ${MAX_BANNERS} banners allowed. Pehle koi purana banner delete karein.`);
    }
  }
});

bannerSchema.statics.MAX_BANNERS = MAX_BANNERS;

module.exports = mongoose.model("Banner", bannerSchema);
