const fs = require("fs");
const path = require("path");
const Banner = require("../Models/BannerModel"); // folder/file ka naam exact match hona chahiye

// Purani image file delete karne ka helper
const removeImageFile = (imagePath) => {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  const fullPath = path.join(__dirname, "..", imagePath);
  fs.unlink(fullPath, () => {}); // error ignore (file pehle se na ho to bhi theek)
};

// GET active banners (public)
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create banner (admin)
const createBanner = async (req, res) => {
  try {
    const { title, link, isActive, order } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    if (!image) return res.status(400).json({ message: "Image is required" });

    const banner = await Banner.create({
      title,
      image,
      link,
      isActive: isActive === undefined ? true : isActive === "true" || isActive === true,
      order: Number(order) || 0,
    });
    res.status(201).json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT update banner (admin)
const updateBanner = async (req, res) => {
  try {
    const existing = await Banner.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Banner not found" });

    const updates = { ...req.body };
    if (updates.isActive !== undefined) {
      updates.isActive = updates.isActive === "true" || updates.isActive === true;
    }
    if (updates.order !== undefined) updates.order = Number(updates.order) || 0;

    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
      removeImageFile(existing.image);
    }

    const banner = await Banner.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE banner (admin)
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    removeImageFile(banner.image);
    res.status(200).json({ message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Sirf ek hi export style use karein
module.exports = { getBanners, createBanner, updateBanner, deleteBanner };
