const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  toggleBlockUser,
  getUserById,
} = require("../Controllers/adminusercontroller"); // path check karo

// Admin routes (baad mein auth middleware laga dena)
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/toggle-block", toggleBlockUser);

module.exports = router;