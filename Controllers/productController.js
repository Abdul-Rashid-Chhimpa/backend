const mongoose = require("mongoose");
const Product = require("../Models/product3d");

const resolvePositiveNumber = (...values) => {
  for (const val of values) {
    if (val !== undefined && val !== null && val !== "") {
      const num = Number(val);
      if (!Number.isNaN(num) && num >= 0) {
        return num;
      }
    }
  }
  return undefined;
};

const normalizeProductForResponse = (doc) => {
  if (!doc) return doc;

  const firstTierPrice =
    Array.isArray(doc.pricing) && doc.pricing.length > 0
      ? Number(doc.pricing[0]?.price)
      : undefined;

  const mrp = resolvePositiveNumber(doc.price, doc.mrp, firstTierPrice) ?? 0;
  const sellingPrice =
    resolvePositiveNumber(
      doc.discountPrice,
      doc.sellingPrice,
      firstTierPrice,
      mrp
    ) ?? mrp;

  return {
    ...doc,
    price: mrp,
    mrp,
    sellingPrice,
    discountPrice: sellingPrice,
    pricing:
      Array.isArray(doc.pricing) && doc.pricing.length > 0
        ? doc.pricing
        : [{ quantity: 1, price: sellingPrice }],
  };
};

exports.createProduct = async (req, res) => {
  try {
    const body = { ...req.body };

    const firstTierPrice =
      Array.isArray(body.pricing) && body.pricing.length > 0
        ? Number(body.pricing[0]?.price)
        : undefined;

    const resolvedMrp = resolvePositiveNumber(
      body.price,
      body.mrp,
      firstTierPrice,
      body.discountPrice,
      body.sellingPrice
    );

    const resolvedSelling = resolvePositiveNumber(
      body.discountPrice,
      body.sellingPrice,
      firstTierPrice,
      resolvedMrp
    );

    if (resolvedMrp !== undefined) {
      body.price = resolvedMrp;
      body.mrp = resolvedMrp;
    }

    if (resolvedSelling !== undefined) {
      body.discountPrice = resolvedSelling;
      body.sellingPrice = resolvedSelling;
    }

    if (!Array.isArray(body.pricing) || body.pricing.length === 0) {
      const tierPrice = resolvedSelling ?? resolvedMrp;
      if (tierPrice !== undefined) {
        body.pricing = [{ quantity: 1, price: tierPrice }];
      }
    }

    const created = await Product.create(body);
    const product = normalizeProductForResponse(created.toObject());

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { category, search, status } = req.query;
    const query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const rawProducts = await Product.find(query).lean().sort({ createdAt: -1 });
    const products = rawProducts.map(normalizeProductForResponse);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Fetch Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const rawProduct = await Product.findById(req.params.id).lean();
    if (!rawProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const product = normalizeProductForResponse(rawProduct);
    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Fetch Single Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};
