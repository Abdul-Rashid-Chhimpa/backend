const express = require("express");
const router = express.Router();
import { protect } from "../middleware/authMiddleware.js";
const {
  register,
  login,
  forgotPassword,
  resetPassword,
   updateProfile
} = require("../Controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/profile", protect, updateProfile);

module.exports = router;
