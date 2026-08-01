const User = require("../models/User"); // Path apne User model ke hisab se check karein

const updateProfile = async (req, res) => {
  try {
    // req.user me middleware se decoded id milegi (e.g., req.user.id ya req.user._id)
    const userId = req.user.id || req.user._id;

    const { name, mobile, address, city, state, pincode, country } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          mobile,
          address,
          city,
          state,
          pincode,
          country,
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

module.exports = { updateProfile };