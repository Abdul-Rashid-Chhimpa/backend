const express = require("express");
const router = express.Router();

const Product = require("../Models/productdb");
const upload = require("../Middelware/upload");


// ======================================
// ADD PRODUCT
// ======================================

router.post(
  "/add-product",
  upload.array("images", 10),
  async (req, res) => {
    try {

      let pricing = [];

      if (req.body.pricing) {
        pricing = JSON.parse(req.body.pricing);
      }

      const imageUrls = req.files
        ? req.files.map(file => file.path)
        : [];

      const product = await Product.create({

        name: req.body.name,

        brand: req.body.brand,

        category: req.body.category,

        material: req.body.material,

        stock: Number(req.body.stock),

        description: req.body.description,

        pricing,

        images: imageUrls,

      });

      return res.status(201).json({

        success: true,

        message: "Product Added Successfully",

        product,

      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({

        success: false,

        message: error.message,

      });

    }
  }
);



// ======================================
// GET ALL PRODUCTS
// ======================================

router.get("/", async (req, res) => {

  try {

    const products = await Product.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({

      success: true,

      products,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

});


// ======================================
// GET SINGLE PRODUCT
// ======================================

router.get("/:id", async (req, res) => {

  try {

    const product = await Product.findById(req.params.id);

    if (!product) {

      return res.status(404).json({

        success: false,

        message: "Product Not Found",

      });

    }

    return res.status(200).json({

      success: true,

      product,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

});
// ======================================
// UPDATE PRODUCT
// ======================================

router.put(
  "/:id",
  upload.array("images", 10),
  async (req, res) => {

    try {

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product Not Found",
        });
      }

      // ===============================
      // BASIC DETAILS
      // ===============================

      const updateData = {

        name: req.body.name,

        brand: req.body.brand,

        category: req.body.category,

        material: req.body.material,

        stock: Number(req.body.stock),

        description: req.body.description,

      };

      // ===============================
      // PRICING
      // ===============================

      if (req.body.pricing) {

        updateData.pricing = JSON.parse(
          req.body.pricing
        );

      }

      // ===============================
      // EXISTING IMAGES
      // ===============================

      let images = [];

      if (req.body.images) {

        images = JSON.parse(req.body.images);

      } else {

        images = [...product.images];

      }

      // ===============================
      // REPLACE INDEXES
      // ===============================

      let replaceIndexes = [];

      if (req.body.replaceIndexes) {

        replaceIndexes = Array.isArray(
          req.body.replaceIndexes
        )
          ? req.body.replaceIndexes
          : [req.body.replaceIndexes];

      }

      // ===============================
      // NEW / REPLACED IMAGES
      // ===============================

      if (req.files && req.files.length > 0) {

        req.files.forEach((file, i) => {

          const replaceIndex = Number(
            replaceIndexes[i]
          );

          if (
            !isNaN(replaceIndex) &&
            replaceIndex >= 0 &&
            replaceIndex < images.length
          ) {

            // Replace Existing Image

            images[replaceIndex] = file.path;

          } else {

            // Add New Image

            images.push(file.path);

          }

        });

      }

      updateData.images = images;

      // ===============================
      // UPDATE
      // ===============================

      const updatedProduct =
        await Product.findByIdAndUpdate(

          req.params.id,

          updateData,

          {

            new: true,

            runValidators: true,

          }

        );

      return res.status(200).json({

        success: true,

        message: "Product Updated Successfully",

        product: updatedProduct,

      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({

        success: false,

        message: error.message,

      });

    }

  }
);
// ======================================
// DELETE PRODUCT
// ======================================

router.delete("/:id", async (req, res) => {

  try {

    const product = await Product.findById(req.params.id);

    if (!product) {

      return res.status(404).json({

        success: false,

        message: "Product Not Found",

      });

    }

    // ===============================
    // DELETE PRODUCT
    // ===============================

    await Product.findByIdAndDelete(req.params.id);

    return res.status(200).json({

      success: true,

      message: "Product Deleted Successfully",

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

});


router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success message (security best practice)
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists with this email, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = resetTokenExpiry;

    await user.save({ validateBeforeSave: false });

    // Create reset URL (change frontend URL according to your domain)
    const resetUrl = `https://your-frontend-domain.com/reset-password/${resetToken}`;

    // Send email (configure your transporter)
    const transporter = nodemailer.createTransport({
      service: "gmail", // or use SendGrid, Resend, etc.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Pedwal" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Password Reset</h2>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

// ==================== RESET PASSWORD ====================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Hash the token to compare
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

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
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful. You can now login.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

// ======================================
// EXPORT ROUTER
// ======================================

module.exports = router;
