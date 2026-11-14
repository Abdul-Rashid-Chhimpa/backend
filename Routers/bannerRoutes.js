const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../Controllers/bannerController");

// Path check karein: Linux (Render) par spelling aur capital letters exact hone chahiye
const verifyToken = require("../Middelware/authMiddleware");

// Admin check (apne user model ke hisaab se role field badal lein)
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.isAdmin)) {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};

// Multer: memory me file lo, phir controller se Cloudinary/disk par save karo
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

// Public: home page ke liye
router.get("/", getBanners);

// Admin only
router.post("/", verifyToken, isAdmin, upload.single("image"), createBanner);
router.put("/:id", verifyToken, isAdmin, upload.single("image"), updateBanner);
router.delete("/:id", verifyToken, isAdmin, deleteBanner);

module.exports = router;
