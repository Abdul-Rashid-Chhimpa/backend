const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const bannerController = require("../Controllers/bannerController");
const { getBanners, createBanner, updateBanner, deleteBanner } = bannerController;

// verifyToken: dono export style support karta hai
const authModule = require("../Middelware/authMiddleware");
const verifyToken =
  typeof authModule === "function"
    ? authModule
    : authModule.verifyToken || authModule.protect || authModule.authMiddleware;

// Admin check (role field apne user model ke hisaab se badal lein)
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.isAdmin === true)) {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};

// Multer disk storage -> /uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `banner-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

// Startup check: kaun sa handler missing hai ye clearly dikhayega
const handlers = { verifyToken, isAdmin, getBanners, createBanner, updateBanner, deleteBanner };
Object.entries(handlers).forEach(([name, fn]) => {
  if (typeof fn !== "function") {
    throw new Error(`bannerRoutes: "${name}" is ${typeof fn}, function hona chahiye. Export/import check karein.`);
  }
});

// Routes
router.get("/", getBanners);
router.post("/", verifyToken, isAdmin, upload.single("image"), createBanner);
router.put("/:id", verifyToken, isAdmin, upload.single("image"), updateBanner);
router.delete("/:id", verifyToken, isAdmin, deleteBanner);

module.exports = router;
