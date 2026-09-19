const express = require("express");
const router = express.Router();
const Product = require("../Models/productdb");
const upload = require("../Middelware/upload");

// Safe Helper for Parsing JSON (Handles strings, arrays, objects)
const parseJSON = (data, fallback = {}) => {
  if (data === undefined || data === null) return fallback;
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
    const paymentMethods = parseJSON(req.body.paymentMethods, {});

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
router.put("/:id", upload.array("images"), async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Safely Parse JSON strings sent via FormData
    let pricing = [];
    if (req.body.pricing) {
      pricing = typeof req.body.pricing === "string" 
        ? JSON.parse(req.body.pricing) 
        : req.body.pricing;
    }

    let delivery = {};
    if (req.body.delivery) {
      delivery = typeof req.body.delivery === "string" 
        ? JSON.parse(req.body.delivery) 
        : req.body.delivery;
    }

    let paymentMethods = [];
    if (req.body.paymentMethods) {
      paymentMethods = typeof req.body.paymentMethods === "string" 
        ? JSON.parse(req.body.paymentMethods) 
        : req.body.paymentMethods;
    }

    let existingImages = [];
    if (req.body.existingImages) {
      existingImages = typeof req.body.existingImages === "string" 
        ? JSON.parse(req.body.existingImages) 
        : req.body.existingImages;
    }

    // 2. Process newly uploaded images (if Cloudinary middleware is attached, use req.files URLs)
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      // If uploading to Cloudinary manually or via helper:
      // newImageUrls = await uploadToCloudinary(req.files);
    }

    const finalImages = [...existingImages, ...newImageUrls];

    // 3. Build Update Object
    const updateData = {
      name: req.body.name,
      brand: req.body.brand,
      category: req.body.category,
      material: req.body.material,
      stock: Number(req.body.stock) || 0,
      size: req.body.size,
      weight: req.body.weight,
      gst: Number(req.body.gst) || 0,
      variantGroup: req.body.variantGroup,
      description: req.body.description,
      isNewArrival: req.body.isNewArrival === "true" || req.body.isNewArrival === true,
      discountPercentage: Number(req.body.discountPercentage) || 0,
      offerTag: req.body.offerTag || "",
      pricing,
      delivery,
      paymentMethods,
      ...(finalImages.length > 0 && { images: finalImages }),
    };

    // 4. Update Document in MongoDB ({ new: true } returns updated doc)
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
