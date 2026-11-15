const Product = require("../models/Product");

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      tagline,
      description,
      price,
      discountPrice,
      category,
      material,
      warranty,
      status,
      images,
      frames360,
      specs,
      stock,
    } = req.body;

    if (!name || !price || !category || !images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide mandatory fields (name, price, category, images).",
      });
    }

    const newProduct = await Product.create({
      name,
      tagline,
      description,
      price,
      discountPrice: discountPrice || undefined,
      category,
      material,
      warranty,
      status: status || "Active",
      images,
      frames360: frames360 || [],
      is360Enabled: frames360 && frames360.length > 0,
      specs: specs || [],
      stock: stock || 10,
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
