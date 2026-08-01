const express = require("express");
const router = express.Router();

// 1. Correct middleware import (CommonJS default import)
// Note: Folder name check kar lein ("Middelware" vs "middleware")
const auth = require("../Middelware/authMiddleware"); 

// 2. Import all controllers together in a single destructuring block
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  updateProfile,
} = require("../Controllers/authController");

// Routes Definition
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Profile Update Route (Protected)
router.put("/profile", auth, updateProfile);

module.exports = router;
