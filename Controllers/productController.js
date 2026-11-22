const Product = require("../Models/product3d");

exports.createProduct = async (req, res) => {
  try {
    const body = { ...req.body };

    const firstTierPrice =
      Array.isArray(body.pricing) && body.pricing.length > 0
        ? Number(body.pricing[0]?.price)
        : NaN;

    const candidates = [
      body.price,
      body.mrp,
      body.discountPrice,
      body.sellingPrice,
      firstTierPrice,
    ];

    let resolvedPrice;
    for (const val of candidates) {
      if (val !== undefined && val !== null && val !== "") {
        const num = Number(val);
        if (!Number.isNaN(num) && num >= 0) {
          resolvedPrice = num;
          break;
        }
      }
    }

    if (resolvedPrice !== undefined) {
      body.price = resolvedPrice;
    }

    if (body.discountPrice === undefined || body.discountPrice === null || body.discountPrice === "") {
      body.discountPrice = resolvedPrice ?? 0;
    } else {
      body.discountPrice = Number(body.discountPrice);
    }

    if (!Array.isArray(body.pricing) || body.pricing.length === 0) {
      if (resolvedPrice !== undefined) {
        body.pricing = [{ quantity: 1, price: body.discountPrice || resolvedPrice }];
      }
    }

    const product = await Product3D.create(body);
    return res.status(201).json({ success: true, product });
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
    const { category, search } = req.query;
    const query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query).lean().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Fetch Products Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Fetch Single Product Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
