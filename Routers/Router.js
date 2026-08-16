const express = require("express");
const router = express.Router();
const Product = require("../Models/productdb");
const upload = require("../Middelware/upload");

// Safe Helper for Parsing JSON
const parseJSON = (data, fallback = []) => {
  if (!data) return fallback;
  try {
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    return fallback;
  }
};

// ======================================
// ADD PRODUCT
// ======================================
router.post("/add-product", upload.array("images", 10), async (req, res) => {
  try {
    const pricing = parseJSON(req.body.pricing, []);
    const imageUrls = req.files ? req.files.map((file) => file.path) : [];

    const variantGroupValue =
      req.body.variantGroup && req.body.variantGroup.trim() !== ""
        ? req.body.variantGroup.trim()
        : null;

    const product = await Product.create({
      name: req.body.name,
      brand: req.body.brand,
      category: req.body.category,
      material: req.body.material,
      stock: Number(req.body.stock) || 0,
      description: req.body.description,
      size: req.body.size || "",
      weight: req.body.weight || "",
      gst: req.body.gst ? Number(req.body.gst) : 0,
      pricing,
      images: imageUrls,
      variantGroup: variantGroupValue,
    });

    return res.status(201).json({
      success: true,
      message: "Product Added Successfully",
      product,
    });
  } catch (error) {
    console.error("Error in add-product:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================
// GET ALL PRODUCTS
// ======================================
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.variantGroup) filter.variantGroup = req.query.variantGroup;
    if (req.query.category) filter.category = req.query.category;

    const products = await Product.find(filter)
      .select(
        "name price images category stock brand material offer pricing variantGroup description size weight gst"
      )
      .sort({ createdAt: -1 })
      .lean()
      .limit(100);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error in get-all-products:", error);
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
    console.error("Error in get-single-product:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================
// UPDATE PRODUCT
// ======================================
router.put("/:id", upload.array("images", 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    let updatedVariantGroup = product.variantGroup;
    if (req.body.variantGroup !== undefined) {
      updatedVariantGroup =
        req.body.variantGroup.trim() !== ""
          ? req.body.variantGroup.trim()
          : null;
    }

    const updateData = {
      name: req.body.name,
      brand: req.body.brand,
      category: req.body.category,
      material: req.body.material,
      stock: Number(req.body.stock) || 0,
      description: req.body.description,
      variantGroup: updatedVariantGroup,
    };

    if (req.body.size !== undefined) updateData.size = req.body.size;
    if (req.body.weight !== undefined) updateData.weight = req.body.weight;
    if (req.body.gst !== undefined) updateData.gst = Number(req.body.gst) || 0;

    if (req.body.pricing) {
      updateData.pricing = parseJSON(req.body.pricing, []);
    }

    let images = [];
    if (req.body.images) {
      images = parseJSON(req.body.images, []);
    } else if (req.body.existingImages) {
      images = parseJSON(req.body.existingImages, []);
    } else {
      images = [...product.images];
    }

    let replaceIndexes = parseJSON(req.body.replaceIndexes, []);
    if (!Array.isArray(replaceIndexes) && req.body.replaceIndexes) {
      replaceIndexes = [req.body.replaceIndexes];
    }

    if (req.files && req.files.length > 0) {
      req.files.forEach((file, i) => {
        const replaceIndex = Number(replaceIndexes[i]);
        if (
          !isNaN(replaceIndex) &&
          replaceIndex >= 0 &&
          replaceIndex < images.length
        ) {
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
    console.error("Error in update-product:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================
// DELETE PRODUCT
// ======================================
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product Deleted Successfully",
    });
  } catch (error) {
    console.error("Error in delete-product:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
