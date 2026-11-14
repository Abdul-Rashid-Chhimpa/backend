
const cloudinary = require("../Config/cloudinary");
const Banner = require("../Models/Banner");

const MAX_BANNERS = 5;

// Delete image from Cloudinary or legacy local uploads
const removeImage = async (imagePath) => {
  if (!imagePath) return;

  
  try {
    // Delete old local image (legacy support)
    if (imagePath.startsWith("/uploads/")) {
      const fs = require("fs");
      const path = require("path");

      const fullPath = path.join(__dirname, "..", imagePath);

      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error("Local image deletion error:", err.message);
          }
        });
      }

      return;
    }

    // Delete Cloudinary image
    if (imagePath.includes("res.cloudinary.com")) {
      const urlParts = imagePath.split("/upload/");

      if (urlParts.length < 2) return;

      let publicId = urlParts[1];

      // Remove version number (v123456789/)
      publicId = publicId.replace(/^v\d+\//, "");

      // Remove file extension
      publicId = publicId.replace(/\.[^/.]+$/, "");

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });

      console.log("Cloudinary image deletion:", result.result);
    }
  } catch (error) {
    console.error("Image deletion error:", error.message);
  }
};

// GET banners (public)
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(MAX_BANNERS);

    return res.status(200).json({
      success: true,
      banners,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// POST create banner (admin)
const createBanner = async (req, res) => {
  try {
    const count = await Banner.countDocuments();

    if (count >= MAX_BANNERS) {
      if (req.file?.path) {
        await removeImage(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_BANNERS} banners allowed. Pehle koi purana banner delete karein.`,
      });
    }

    const { tagline, title, specs, link, order } = req.body;

    // Cloudinary returns uploaded image URL in req.file.path
    const image = req.file ? req.file.path : req.body.image;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const banner = await Banner.create({
      image,
      tagline,
      title,
      specs,
      link,
      order: Number(order) || 0,
    });

    return res.status(201).json({
      success: true,
      banner,
    });
  } catch (err) {
    if (req.file?.path) {
      await removeImage(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// PUT update banner (text, image, or both)
const updateBanner = async (req, res) => {
  let newImagePath = null;

  try {
    const existing = await Banner.findById(req.params.id);

    if (!existing) {
      if (req.file?.path) {
        await removeImage(req.file.path);
      }

      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    const {
      tagline,
      title,
      specs,
      link,
      order,
      isActive,
    } = req.body;

    const updates = {};

    if (tagline !== undefined) updates.tagline = tagline;
    if (title !== undefined) updates.title = title;
    if (specs !== undefined) updates.specs = specs;
    if (link !== undefined) updates.link = link;

    if (order !== undefined) {
      updates.order = Number(order) || 0;
    }

    if (isActive !== undefined) {
      updates.isActive =
        isActive === "true" || isActive === true;
    }

    // New Cloudinary image URL
    if (req.file) {
      newImagePath = req.file.path;
      updates.image = newImagePath;
    }

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    // Delete old image only after successful database update
    if (newImagePath && banner) {
      await removeImage(existing.image);
    }

    return res.status(200).json({
      success: true,
      banner,
    });
  } catch (err) {
    // If database update fails, clean up newly uploaded image
    if (newImagePath) {
      await removeImage(newImagePath);
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE banner (admin)
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    await Banner.findByIdAndDelete(req.params.id);

    // Delete associated image
    await removeImage(banner.image);

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
