const express = require("express");
const router = express.Router();
const Product = require("../Models/productdb"); // path check karo (M capital?)
const upload = require("../Middelware/upload"); // path check karo

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

      const imageUrls = req.files ? req.files.map((file) => file.path) : [];

      const product = await Product.create({
        name: req.body.name,
        brand: req.body.brand,
        category: req.body.category,
        material: req.body.material,
        stock: Number(req.body.stock),
        description: req.body.description,
        pricing,
        images: imageUrls,
        variantGroup: req.body.variantGroup || null, // varieties ke liye
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
// GET ALL PRODUCTS (with filter + speed)
// ======================================
router.get("/", async (req, res) => {
  try {
    const filter = {};

    // Variety filter
    if (req.query.variantGroup) {
      filter.variantGroup = req.query.variantGroup;
    }

    // Category filter (optional)
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const products = await Product.find(filter)
      .select(
        "name price images category stock brand material offer pricing variantGroup description"
      )
      .sort({ createdAt: -1 })
      .lean()
      .limit(100);

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
    const product = await Product.findById(req.params.id).lean();

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

      const updateData = {
        name: req.body.name,
        brand: req.body.brand,
        category: req.body.category,
        material: req.body.material,
        stock: Number(req.body.stock),
        description: req.body.description,
        variantGroup: req.body.variantGroup || product.variantGroup || null,
      };

      if (req.body.pricing) {
        updateData.pricing = JSON.parse(req.body.pricing);
      }

      let images = [];
      if (req.body.images) {
        images = JSON.parse(req.body.images);
      } else {
        images = [...product.images];
      }

      let replaceIndexes = [];
      if (req.body.replaceIndexes) {
        replaceIndexes = Array.isArray(req.body.replaceIndexes)
          ? req.body.replaceIndexes
          : [req.body.replaceIndexes];
      }

      if (req.files && req.files.length > 0) {
        req.files.forEach((file, i) => {
          const replaceIndex = Number(replaceIndexes[i]);
          if (!isNaN(replaceIndex) && replaceIndex >= 0 && replaceIndex < images.length) {
            images[replaceIndex] = file.path;
          } else {
            images.push(file.path);
          }
        });
      }

      updateData.images = images;

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
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

module.exports = router;
