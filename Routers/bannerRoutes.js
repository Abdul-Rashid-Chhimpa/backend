const express = require("express");
const router = express.Router();
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../Controllers/bannerController");
const verifyToken = require("../middlewares/authMiddleware"); // Aapka existing auth middleware

router.get("/", getBanners);
router.post("/", verifyToken, createBanner);
router.put("/:id", verifyToken, updateBanner);
router.delete("/:id", verifyToken, deleteBanner);

module.exports = router;
