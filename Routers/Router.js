const express = require("express");
const router = express.Router();

const Product = require("../Models/productdb");
const upload = require("../Middelware/upload");

// ======================
// ADD PRODUCT
// ======================
router.post(
  "/add-product",
  upload.array("images", 10),
  async (req, res) => {
    try {
      // Images
      const imageUrls =
        req.files?.map(
          (file) =>
            `https://backend-3-axez.onrender.com/uploads/${file.filename}`
        ) || [];

      // Pricing JSON Parse
      let pricing = [];

      if (req.body.pricing) {
        pricing = JSON.parse(req.body.pricing);
      }

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

      res.status(201).json({
        success: true,
        message: "Product Added Successfully",
        product,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================
// GET ALL PRODUCTS
// ======================
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================
// GET SINGLE PRODUCT
// ======================
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================
// UPDATE PRODUCT
// ======================
router.put(
  "/:id",
  upload.array("images", 10),
  async (req, res) => {
    try {
      const updateData = {
        name: req.body.name,
        brand: req.body.brand,
        category: req.body.category,
        material: req.body.material,
        stock: Number(req.body.stock),
        description: req.body.description,
      };

      if (req.body.pricing) {
        updateData.pricing = JSON.parse(
          req.body.pricing
        );
      }

      if (req.files && req.files.length > 0) {
        updateData.images = req.files.map(
          (file) =>
            `https://backend-3-axez.onrender.com/uploads/${file.filename}`
        );
      }

      const product =
        await Product.findByIdAndUpdate(
          req.params.id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product Not Found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Product Updated Successfully",
        product,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================
// DELETE PRODUCT
// ======================
router.delete("/:id", async (req, res) => {
  try {
    const product =
      await Product.findByIdAndDelete(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
