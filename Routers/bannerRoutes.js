
const express = require("express");
const multer = require("multer");
const router = express.Router();

const bannerController = require("../Controllers/bannerController");
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = bannerController;

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Authentication middleware
const authModule = require("../Middelware/authMiddleware");

const verifyToken =
  typeof authModule === "function"
    ? authModule
    : authModule.verifyToken ||
      authModule.protect ||
      authModule.authMiddleware;

// Admin authorization
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.isAdmin === true)) {
    return next();
  }

  return res.status(403).json({
    message: "Admin access only",
  });
};

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
  },
});

// Multer configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"));
    }
  },
});

// Validate handlers
const handlers = {
  verifyToken,
  isAdmin,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};

Object.entries(handlers).forEach(([name, fn]) => {
  if (typeof fn !== "function") {
    throw new Error(
      `bannerRoutes: "${name}" is ${typeof fn}, function hona chahiye.`
    );
  }
});

// Routes
router.get("/", getBanners);

router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("image"),
  createBanner
);

router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  updateBanner
);

router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  deleteBanner
);

module.exports = router;
