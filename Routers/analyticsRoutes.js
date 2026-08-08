const express = require("express");
const router = express.Router();
const { getAnalytics } = require("../Controllers/analyticsController");

// Optional: admin auth middleware yahan laga sakte ho
// const { protect, admin } = require("../middleware/auth");

router.get("/", getAnalytics);
// router.get("/", protect, admin, getAnalytics);

module.exports = router;
