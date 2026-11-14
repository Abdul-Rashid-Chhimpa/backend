const express = require("express");
const router = express.Router();

// Controller functions import karein
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../Controllers/bannerController");

// Auth Middleware import karein (apne project ke path ke hisaab se check kar lein)
const verifyToken = require("../Middelware/authMiddleware");

// Routes definition
router.get("/", getBanners);
router.post("/", verifyToken, createBanner); // Line 12 wala post route
router.put("/:id", verifyToken, updateBanner);
router.delete("/:id", verifyToken, deleteBanner);

module.exports = router;
