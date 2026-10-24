const express = require("express");
const mongoose = require("mongoose");
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

// Keeps only valid, unique MongoDB ObjectIds.
const sanitizeUserIds = (list) => {
  if (!Array.isArray(list)) return [];

  const ids = list
    .map((u) => String(u && typeof u === "object" ? u._id || u.id : u).trim())
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  return Array.from(new Set(ids));
};

// Normalizes the targeting type to only "all" or "selected"
const normalizeTargetType = (value) => (value === "selected" ? "selected" : "all");

// HSN code: digits only, max 8 characters (e.g. "8203")
const sanitizeHsnCode = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 8);

// FIXED: Robust User ID Extraction from Request (Headers, Query & Body)
const getRequestUserId = (req) => {
  const raw =
    (req.user && (req.user._id || req.user.id)) ||
    req.headers["x-user-id"] ||
    req.headers["user-id"] ||
    req.query.userId ||
    (req.body && req.body.userId) ||
    "";

  const id = String(raw).trim();
  return mongoose.Types.ObjectId.isValid(id) ? id : "";
};

// FIXED: Applies correct discount per user (Selected vs Other Users)
const applyDiscountVisibility = (product, userId) => {
  if (!product) return product;

  const allowed = (product.allowedUserIds || []).map((u) =>
    String(u && typeof u === "object" ? u._id || u.id : u).trim()
  );

  const isTargeted = product.discountTargetType === "selected";
  const currentUserIdStr = String(userId).trim();

  // Selected User check
  const isSelectedUser =
    isTargeted && currentUserIdStr !== "" && allowed.includes(currentUserIdStr);

  const result = { ...product };

  if (isTargeted) {
    if (isSelectedUser) {
      // Selected User gets Special Discount
      result.discountPercent = Number(product.discountPercent) || 0;
      result.discountNote = product.discountNote || "";
      result.hasSpecialDiscount = true;
    } else {
      // ALL OTHER USERS (Not Selected) get the "Other Users Discount"
      result.discountPercent = Number(product.otherUsersDiscountPercent) || 0;
      result.discountNote = product.otherUsersDiscountNote || "";
      result.hasSpecialDiscount = false;
    }
  } else {
    // Regular Public Offer (discountTargetType === 'all')
    result.discountPercent = Number(product.discountPercent) || 0;
    result.discountNote = product.discountNote || "";
    result.hasSpecialDiscount = false;
  }

  // Cleanup internal fields before sending response to client
  delete result.otherUsersDiscountPercent;
  delete result.otherUsersDiscountNote;
  delete result.allowedUserIds;

  return result;
};

// Builds the final images array in the right order.
const buildFinalImages = (existing, uploaded, replaceIndexes) => {
  const total = existing.length + uploaded.length;
  const result = new Array(total).fill(null);

  const indexes = []
    .concat(replaceIndexes === undefined ? [] : replaceIndexes)
    .map((n) => Number(n));

  const leftoverUploads = [];

  uploaded.forEach((url, i) => {
    const pos = indexes[i];

    if (Number.isInteger(pos) && pos >= 0 && pos < total && result[pos] === null) {
      result[pos] = url;
    } else {
      leftoverUploads.push(url);
    }
  });

  const fillers = [...existing, ...leftoverUploads];
  let f = 0;

  for (let i = 0; i < total; i++) {
    if (result[i] === null) {
      result[i] = fillers[f++];
    }
  }

  return result.filter(Boolean);
};

// ======================================
// ADD PRODUCT
// ======================================
router.post("/add-product", upload.array("images", 10), async (req, res) => {
  try {
    const pricing = parseJSON(req.body.pricing, []);
    const paymentMethods = parseJSON(req.body.paymentMethods, []);
    const allowedUserIds = sanitizeUserIds(parseJSON(req.body.allowedUserIds, []));

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

    const discountTargetType = normalizeTargetType(req.body.discountTargetType);

    if (discountTargetType === "selected" && allowedUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one user for targeted discount",
      });
    }

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
      hsnCode: sanitizeHsnCode(req.body.hsnCode),

      // --- OFFERS & DISCOUNTS FOR SELECTED USERS ---
      discountPercent: Number(req.body.discountPercent) || 0,
      discountNote: req.body.discountNote || "",

      // --- USER TARGETED DISCOUNT ---
      discountTargetType: discountTargetType,
      allowedUserIds: discountTargetType === "selected" ? allowedUserIds : [],

      // --- DISCOUNT SHOWN TO EVERYONE WHO IS NOT SELECTED ---
      otherUsersDiscountPercent:
        discountTargetType === "selected"
          ? Number(req.body.otherUsersDiscountPercent) || 0
          : 0,
      otherUsersDiscountNote:
        discountTargetType === "selected"
          ? req.body.otherUsersDiscountNote || ""
          : "",

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
        "name price images category stock brand material pricing variantGroup description size weight gst hsnCode delivery paymentMethods discountPercent discountNote discountTargetType allowedUserIds otherUsersDiscountPercent otherUsersDiscountNote isNewProduct"
      )
      .sort({ createdAt: -1 })
      .lean()
      .limit(100);

    const userId = getRequestUserId(req);

    return res.status(200).json({
      success: true,
      viewerId: userId,
      products: products.map((p) => applyDiscountVisibility(p, userId)),
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
// ADMIN: GET ALL PRODUCTS (FULL DATA)
// ======================================
router.get("/admin/all", async (req, res) => {
  try {
    const products = await Product.find({})
      .select(
        "name price images category stock brand material pricing variantGroup description size weight gst hsnCode delivery paymentMethods discountPercent discountNote discountTargetType allowedUserIds otherUsersDiscountPercent otherUsersDiscountNote isNewProduct"
      )
      .sort({ createdAt: -1 })
      .lean()
      .limit(100);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error in admin-get-all-products:", error);
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
      product: applyDiscountVisibility(product, getRequestUserId(req)),
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

    const currentProduct = await Product.findById(id).select("delivery images").lean();

    if (!currentProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const pricing = parseJSON(req.body.pricing, []);
    const incomingDelivery = parseJSON(req.body.delivery, {});
    const paymentMethods = parseJSON(req.body.paymentMethods, []);
    const existingImages = parseJSON(req.body.existingImages, []);
    const allowedUserIds = sanitizeUserIds(parseJSON(req.body.allowedUserIds, []));

    const delivery = { ...(currentProduct.delivery || {}), ...incomingDelivery };

    const newImageUrls = req.files ? req.files.map((file) => file.path) : [];

    const finalImages = buildFinalImages(
      Array.isArray(existingImages) ? existingImages : [],
      newImageUrls,
      req.body.replaceIndexes
    );

    const discountTargetType = normalizeTargetType(req.body.discountTargetType);

    if (discountTargetType === "selected" && allowedUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one user for targeted discount",
      });
    }

    const updateData = {
      name: req.body.name,
      brand: req.body.brand || "",
      category: req.body.category,
      material: req.body.material || "",
      stock: Number(req.body.stock) || 0,
      size: req.body.size || "",
      weight: req.body.weight || "",
      gst: req.body.gst ? Number(req.body.gst) : 0,
      hsnCode: sanitizeHsnCode(req.body.hsnCode),
      variantGroup:
        req.body.variantGroup && req.body.variantGroup.trim() !== ""
          ? req.body.variantGroup.trim()
          : null,
      description: req.body.description || "",

      discountPercent: Number(req.body.discountPercent || req.body.discountPercentage) || 0,
      discountNote: req.body.discountNote || req.body.offerTag || "",
      discountTargetType: discountTargetType,
      allowedUserIds: discountTargetType === "selected" ? allowedUserIds : [],

      otherUsersDiscountPercent:
        discountTargetType === "selected"
          ? Number(req.body.otherUsersDiscountPercent) || 0
          : 0,
      otherUsersDiscountNote:
        discountTargetType === "selected"
          ? req.body.otherUsersDiscountNote || ""
          : "",

      isNewProduct:
        req.body.isNewProduct === true ||
        req.body.isNewProduct === "true" ||
        req.body.isNewArrival === true ||
        req.body.isNewArrival === "true",

      pricing,
      delivery,
      paymentMethods,
    };

    const clientSentImageInfo =
      req.body.existingImages !== undefined || newImageUrls.length > 0;

    if (clientSentImageInfo) {
      if (finalImages.length === 0) {
        return res.status(400).json({
          success: false,
          message: "A product must have at least one image",
        });
      }

      updateData.images = finalImages;
    }

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
