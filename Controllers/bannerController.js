const Banner = require("../models/BannerModel");

// Get all banners (Public)
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Banner (Admin Only)
exports.createBanner = async (req, res) => {
  try {
    const { image, tagline, title, specs, order } = req.body;

    const newBanner = await Banner.create({
      image,
      tagline,
      title,
      specs,
      order,
    });

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      banner: newBanner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Banner (Admin Only)
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { image, tagline, title, specs, order } = req.body;

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { image, tagline, title, specs, order },
      { new: true, runValidators: true }
    );

    if (!updatedBanner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      banner: updatedBanner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Banner (Admin Only)
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBanner = await Banner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
