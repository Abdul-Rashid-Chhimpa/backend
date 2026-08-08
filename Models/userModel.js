// Models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    mobile: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Already compiled ho to wahi return karo
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
