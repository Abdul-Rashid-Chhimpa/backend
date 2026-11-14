const fs = require("fs");
const path = require("path");
const Banner = require("../Models/Banner");

const MAX_BANNERS = 5;

const removeImageFile = (imagePath) => {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  const fullPath = path.join(__dirname, "..", imagePath);
  fs.unlink(fullPath, () => {});
};

// GET banners (public)
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(MAX_BANNERS);
    res.status(200).json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create banner (admin)
const createBanner = async (req, res) => {
  try {
    const count = await Banner.countDocuments();
    if (count >= MAX_BANNERS) {
      if (req.file) removeImageFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_BANNERS} banners allowed. Pehle koi purana banner delete karein.`,
      });
    }

    const { tagline, title, specs, link, order } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    if (!image) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const banner = await Banner.create({
      image,
      tagline,
      title,
      specs,
      link,
      order: Number(order) || 0,
    });
    res.status(201).json({ success: true, banner });
  } catch (err) {
    if (req.file) removeImageFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update banner (admin) - text, image, ya dono
const updateBanner = async (req, res) => {
  try {
    const existing = await Banner.findById(req.params.id);
    if (!existing) {
      if (req.file) removeImageFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    const { tagline, title, specs, link, order, isActive } = req.body;
    const updates = {};
    if (tagline !== undefined) updates.tagline = tagline;
    if (title !== undefined) updates.title = title;
    if (specs !== undefined) updates.specs = specs;
    if (link !== undefined) updates.link = link;
    if (order !== undefined) updates.order = Number(order) || 0;
    if (isActive !== undefined) updates.isActive = isActive === "true" || isActive === true;
    if (req.file) updates.image = `/uploads/${req.file.filename}`;

    const banner = await Banner.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    // Nayi image save hone ke baad hi purani delete karein
    if (req.file) removeImageFile(existing.image);

    res.status(200).json({ success: true, banner });
  } catch (err) {
    if (req.file) removeImageFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE banner (admin)
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    removeImageFile(banner.image);
    res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getBanners, createBanner, updateBanner, deleteBanner };
