const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateSettings,
} = require("../Controllers/settingsController");

// baad mein admin auth middleware laga dena
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

module.exports = router;
