const Product = require("../Models/Product");

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      material,
      stock,
      description,
      pricing,
      images,
      gst,
      hsnCode,
      discountPercent,
      delivery,
      paymentMethods,
    } = req.body;

    // 🔴 Flexible validation: Check mandatory fields based on new schema
    if (!name || !category || !images || images.length === 0 || !pricing || pricing.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide mandatory fields (name, category, images, pricing).",
      });
    }

    const newProduct = await Product.create({
      name,
      brand: brand || "Pedwal",
      category,
      material: material || "Chrome Vanadium Steel",
      stock: stock !== undefined ? Number(stock) : 10,
      description: description || "",
      pricing, // [{ quantity: 1, price: ... }]
      images,
      gst: gst ? Number(gst) : 0,
      hsnCode: hsnCode || "",
      discountPercent: discountPercent ? Number(discountPercent) : 0,
      delivery: delivery || { standardDeliveryCharge: 0, charge: 0 },
      paymentMethods: paymentMethods || { cod: true, phonepe: true, gpay: true },
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
    const { category, search, status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    } else {
      query.status = "Active"; // Public users only see Active products
    }

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
