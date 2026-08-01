const User = require("../Models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
// const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const resend = new Resend(process.env.Key);
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

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }],
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
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Registration Successful",
      user,
    });
  } catch (error) {
    console.log(error);
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

    const user = await User.findOne({ email });

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
      process.env.jwt_secret,
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
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ====================== FORGOT PASSWORD ======================
// ====================== FORGOT PASSWORD ======================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if email field is empty
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 2. Database mein User check karein
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // 🚨 FIX: Agar user nahi mila to yahan se hi error return kar do
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    // 3. Token Generate karein
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 Minutes valid

    await user.save({ validateBeforeSave: false });

    const resetUrl = `https://www.pedwal.in/reset-password/${resetToken}`;

    // 4. Sender Email Setup
    const senderEmail = process.env.NODE_ENV === "production" 
      ? "Pedwal <noreply@pedwal.in>" 
      : "Pedwal <onboarding@resend.dev>"; 

    // 5. Send Email via Resend
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: user.email,
      subject: "Password Reset - Pedwal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #4f46e5;">Reset Your Password</h2>
          <p>Hello ${user.name},</p>
          <p>Click the button below to reset your password. This link is valid for <b>15 minutes</b>.</p>
          
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 28px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Reset Password
          </a>

          <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    // Handle Resend Errors
    if (error) {
      console.error("Resend API Error Detail →", error);
      return res.status(400).json({
        success: false,
        message: `Email sending failed: ${error.message}`,
      });
    }

    console.log("Resend Success Data →", data);

    return res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email",
    });

  } catch (error) {
    console.log("Forgot Password Catch Error →", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send reset link. Please try again later.",
    });
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

    // 1. Hash the incoming URL token to match with Database token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 2. Find user with valid token & check if token is NOT expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token. Please request a new link.",
      });
    }

    // 3. Set new hashed password
    user.password = await bcrypt.hash(password, 10);
    
    // 4. Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // 5. Save without triggering full Mongoose schema validations
    await user.save({ validateBeforeSave: false });

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

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private (Requires Token Authentication)
export const updateProfile = async (req, res) => {
  try {
    // req.user.id authMiddleware se aayega
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Front-end se aaye hue data se fields update karo
    user.name = req.body.name || user.name;
    user.mobile = req.body.mobile || user.mobile;
    user.address = req.body.address || user.address;
    user.city = req.body.city || user.city;
    user.state = req.body.state || user.state;
    user.pincode = req.body.pincode || user.pincode;
    user.country = req.body.country || user.country;

    const updatedUser = await user.save();

    // Sensitive data (password) hata kar response bhejo
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
