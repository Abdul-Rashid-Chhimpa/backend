const Product = require("../Models/productdb");

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      material,
      stock,
      description,
      size,
      weight,
      gst,
      hsnCode,
      discountPercent,
      delivery,
      paymentMethods,
      pricing,
      images,
      variantGroup,
    } = req.body;

    if (!name || !category || !images || images.length === 0 || !pricing || pricing.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide mandatory fields (name, category, images, pricing).",
      });
    }

    const safeDiscountPercent = Math.max(
      0,
      Math.min(100, Number(discountPercent) || 0)
    );

    const newProduct = await Product.create({
      name,
      brand: brand || "Pedwal",
      category,
      material: material || "",
      stock: stock !== undefined ? Number(stock) : 0,
      description: description || "",
      size: size || "",
      weight: weight || "",
      gst: gst ? Math.max(0, Math.min(100, Number(gst))) : 0,
      hsnCode: hsnCode || "",
      discountPercent: safeDiscountPercent,
      delivery: delivery || { standardDeliveryCharge: 0, charge: 0 },
      paymentMethods: paymentMethods || { cod: true, phonepe: true, gpay: true },
      pricing,
      images,
      variantGroup: variantGroup || null,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully!",
      product: newProduct,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ success: false, message: error.message });
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
