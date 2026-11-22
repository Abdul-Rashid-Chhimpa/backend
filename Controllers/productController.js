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
