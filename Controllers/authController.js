const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");

// Multi-env API key resolution so Resend never fails silently
const resendApiKey =
  process.env.Email_Key || process.env.RESEND_API_KEY || process.env.Key;

if (!resendApiKey) {
  console.error("⚠️ Resend API Key is missing in environment variables!");
}

const resend = new Resend(resendApiKey);

// ====================== REGISTER ======================
exports.register = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !mobile || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { mobile }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or Mobile already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      mobile,
      email: cleanEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Registration Successful",
      user,
    });
  } catch (error) {
    console.log("Register Error →", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.jwt_secret || process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.log("Login Error →", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ====================== FORGOT PASSWORD ======================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 1. Plain unhashed token (Sent in Email Link)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Hash generated (Saved in MongoDB)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

    await user.save();

    console.log("=== FORGOT PASSWORD DEBUG ===");
    console.log("Generated Plain Token (Link):", resetToken);
    console.log("Saved Hash in DB:", hashedToken);

    const resetUrl = `https://www.pedwal.in/reset-password/${resetToken}`;

    // ... email send logic using Resend ...
    return res.status(200).json({ success: true, message: "Reset link sent!" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
// ====================== RESET PASSWORD ======================
// ====================== RESET PASSWORD ======================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is missing in request",
      });
    }

    // Clean received token string
    const rawToken = decodeURIComponent(token).trim();

    // Generate SHA-256 Hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    console.log("------------------ RESET PASSWORD DEBUG ------------------");
    console.log("1. Raw Token from Params:", rawToken);
    console.log("2. Generated Hashed Token:", hashedToken);
    console.log("3. Current System Time (ms):", Date.now());

    // Search user with hash and expiry check
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      // Check if token exists but is expired
      const expiredUser = await User.findOne({ resetPasswordToken: hashedToken });
      
      if (expiredUser) {
        console.log("❌ Token matched but it has EXPIRED!");
        return res.status(400).json({
          success: false,
          message: "Reset link has expired (valid for 15 mins only). Please request a new one.",
        });
      }

      console.log("❌ No user found with this token hash!");
      return res.status(400).json({
        success: false,
        message: "Invalid reset token. Please request a new link.",
      });
    }

    console.log("✅ User matched for reset:", user.email);

    // Save new hashed password & clear reset fields
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful! You can now login.",
    });
  } catch (error) {
    console.error("Reset Password Error Details →", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
// ====================== UPDATE PROFILE ======================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.name = req.body.name || user.name;
    user.mobile = req.body.mobile || user.mobile;
    user.address = req.body.address || user.address;
    user.city = req.body.city || user.city;
    user.state = req.body.state || user.state;
    user.pincode = req.body.pincode || user.pincode;
    user.country = req.body.country || user.country;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        pincode: updatedUser.pincode,
        country: updatedUser.country,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: error.message,
    });
  }
};
