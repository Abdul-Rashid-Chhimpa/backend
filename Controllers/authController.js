const User = require("../Models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Security: Always return same message even if user not found
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token and save in DB
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save({ validateBeforeSave: false });

    // ⚠️ Important: Change this URL according to your frontend
    const resetUrl = `https://www.pedwal.in/reset-password/${resetToken}`;
    // Production example:
    // const resetUrl = `https://your-frontend-domain.com/reset-password/${resetToken}`;

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"Pedwal Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request - Pedwal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Reset Your Password</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 28px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Reset Password
          </a>

          <p style="color: #666; font-size: 14px;">This link will expire in <b>15 minutes</b>.</p>
          <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">Pedwal Team</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email",
    });
  } catch (error) {
    console.log("Forgot Password Error →", error);
    res.status(500).json({
      success: false,
      message: "Failed to send reset link. Please try again later.",
    });
  }
};

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

    // Hash the token coming from URL
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now login.",
    });
  } catch (error) {
    console.log("Reset Password Error →", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
