const Product = require("../Models/Product");

// Create New Product with 3D & 360° Frames
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
      discountPrice,
      category,
      material,
      warranty,
      images,
      frames360: frames360 || [],
      is360Enabled: frames360 && frames360.length > 0,
      specs: specs || [],
      stock: stock || 10,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully with 3D/360° views!",
      product: newProduct,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ success: false, message: "Server error while saving product." });
  }
};

// Get All Products (Optimized with .lean() for high speed)
exports.getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Using .lean() for blazing-fast read performance
    const products = await Product.find(query).lean().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Fetch Products Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching products." });
  }
};

// Get Single Product By ID
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
