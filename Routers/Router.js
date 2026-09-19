const express = require("express");
const router = express.Router();
const Product = require("../Models/productdb");
const upload = require("../Middelware/upload");

// Safe Helper for Parsing JSON (Handles strings, arrays, objects)
const parseJSON = (data, fallback = {}) => {
  if (data === undefined || data === null || data === "") return fallback;
  if (typeof data === "object") return data;
  try {
    return JSON.parse(data);
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
    const paymentMethods = parseJSON(req.body.paymentMethods, []);

    // Delivery structure mapping
    let delivery = {};
    if (req.body.delivery) {
      delivery = parseJSON(req.body.delivery, {});
    } else {
      delivery = {
        minQtyForFreeDelivery: Number(req.body.minQtyForFreeDelivery) || 0,
        standardDeliveryCharge: Number(req.body.standardDeliveryCharge) || 0,
        deliveryNote: req.body.deliveryNote || "",
      };
    }

    const imageUrls = req.files ? req.files.map((file) => file.path) : [];

    const variantGroupValue =
      req.body.variantGroup && req.body.variantGroup.trim() !== ""
        ? req.body.variantGroup.trim()
        : null;

    const product = await Product.create({
      name: req.body.name,
      brand: req.body.brand || "",
      category: req.body.category,
      material: req.body.material || "",
      stock: Number(req.body.stock) || 0,
      description: req.body.description || "",
      size: req.body.size || "",
      weight: req.body.weight || "",
      gst: req.body.gst ? Number(req.body.gst) : 0,

      // --- OFFERS & DISCOUNTS ---
      discountPercent: Number(req.body.discountPercent) || 0,
      discountNote: req.body.discountNote || "",

      // --- BADGE TAG ---
      isNewProduct:
        req.body.isNewProduct === true || req.body.isNewProduct === "true",

      delivery: delivery,
      paymentMethods: paymentMethods,
      pricing: pricing,
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
        "name price images category stock brand material pricing variantGroup description size weight gst delivery paymentMethods discountPercent discountNote isNewProduct"
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
    const { id } = req.params;

    // 1. Safely Parse JSON strings sent via FormData using parseJSON
    const pricing = parseJSON(req.body.pricing, []);
    const delivery = parseJSON(req.body.delivery, {});
    const paymentMethods = parseJSON(req.body.paymentMethods, []);
    const existingImages = parseJSON(req.body.existingImages, []);

    // 2. Process newly uploaded image file paths from multer
    const newImageUrls = req.files ? req.files.map((file) => file.path) : [];

    const finalImages = [...existingImages, ...newImageUrls];

    // 3. Build Update Object with matching field names
    const updateData = {
      name: req.body.name,
      brand: req.body.brand || "",
      category: req.body.category,
      material: req.body.material || "",
      stock: Number(req.body.stock) || 0,
      size: req.body.size || "",
      weight: req.body.weight || "",
      gst: req.body.gst ? Number(req.body.gst) : 0,
      variantGroup: req.body.variantGroup || null,
      description: req.body.description || "",

      // --- MATCHED WITH MONGODB SCHEMA ---
      discountPercent: Number(req.body.discountPercent || req.body.discountPercentage) || 0,
      discountNote: req.body.discountNote || req.body.offerTag || "",
      isNewProduct:
        req.body.isNewProduct === true ||
        req.body.isNewProduct === "true" ||
        req.body.isNewArrival === true ||
        req.body.isNewArrival === "true",

      pricing,
      delivery,
      paymentMethods,
    };

    if (finalImages.length > 0) {
      updateData.images = finalImages;
    }

    // 4. Update Document in MongoDB
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({ success: false, message: error.message });
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
