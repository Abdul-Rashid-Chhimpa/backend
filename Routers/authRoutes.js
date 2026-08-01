const express = require("express");
const router = express.Router();

// 1. Correct middleware destructuring import
// Check karein ki folder ka naam "Middelware" h ya "middleware"
const { protect } = require("../Middelware/authMiddleware"); 

// 2. Controllers Import
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

// Profile Update Route (Protected with 'protect' function)
router.put("/profile", protect, updateProfile);

module.exports = router;
