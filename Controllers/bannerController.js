const fs = require("fs");
const path = require("path");
const Banner = require("../Models/Banner"); // file ka naam exact match hona chahiye

const MAX_BANNERS = 5;

// Image file delete karne ka helper
const removeImageFile = (imagePath) => {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  const fullPath = path.join(__dirname, "..", imagePath);
  fs.unlink(fullPath, () => {}); // error ignore
};

// GET active banners (public) - max 5
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(MAX_BANNERS);
    res.status(200).json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create banner (admin) - max 5
const createBanner = async (req, res) => {
  try {
    // Multer file pehle hi save kar chuka hota hai, isliye limit hit hone par use delete karte hain
    const count = await Banner.countDocuments();
    if (count >= MAX_BANNERS) {
      if (req.file) removeImageFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({
        message: `Maximum ${MAX_BANNERS} banners allowed. Pehle koi purana banner delete karein.`,
      });
    }

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
    // Error aaye to uploaded file hata do
    if (req.file) removeImageFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ message: err.message });
  }
};

// PUT update banner (admin)
const updateBanner = async (req, res) => {
  try {
    const existing = await Banner.findById(req.params.id);
    if (!existing) {
      if (req.file) removeImageFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ message: "Banner not found" });
    }

    const updates = { ...req.body };
    if (updates.isActive !== undefined) {
      updates.isActive = updates.isActive === "true" || updates.isActive === true;
    }
    if (updates.order !== undefined) updates.order = Number(updates.order) || 0;

    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }

    const banner = await Banner.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    // Nayi image save hone ke baad hi purani delete karein
    if (req.file) removeImageFile(existing.image);

    res.status(200).json(banner);
  } catch (err) {
    if (req.file) removeImageFile(`/uploads/${req.file.filename}`);
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

module.exports = { getBanners, createBanner, updateBanner, deleteBanner };
