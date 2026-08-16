const Product = require("../Models/productdb");
const User = require("../Models/User"); // Agar aap userModel.js use kar rahe hain toh yahan change kar lein
const Category = require("../Msodels/Category");

exports.getAnalytics = async (req, res) => {
  try {
    // 1. Data Fetching
    const products = await Product.find({});
    const totalUsers = await User.countDocuments({});
    
    let totalCategories = 0;
    try {
      totalCategories = await Category.countDocuments({});
    } catch (err) {
      // Fallback agar Category model se fetch na ho paye
      const uniqueCats = new Set(
        products.map((p) => p.category?.toString()).filter(Boolean)
      );
      totalCategories = uniqueCats.size;
    }

    let totalStock = 0;
    let inventoryValue = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    const lowStockProducts = [];
    const outOfStockProducts = [];

    const formattedProducts = products.map((prod) => {
      // Stock extraction with schema fallback
      const currentStock = Number(
        prod.stock ?? prod.countInStock ?? prod.quantity ?? 0
      );
      const price = Number(prod.price ?? prod.unitPrice ?? prod.cost ?? 0);

      totalStock += currentStock;
      inventoryValue += currentStock * price;

      // Dynamic Stock Condition Check
      if (currentStock === 0) {
        outOfStock += 1;
        outOfStockProducts.push({ ...prod._doc, stock: currentStock, price });
      } else if (currentStock <= 20) {
        lowStock += 1;
        lowStockProducts.push({ ...prod._doc, stock: currentStock, price });
      } else {
        inStock += 1;
      }

      return {
        ...prod._doc,
        stock: currentStock,
        price,
      };
    });

    // Category Breakdown
    const catMap = {};
    products.forEach((p) => {
      const catName = p.category?.name || p.category || "Uncategorized";
      const stock = Number(p.stock ?? p.countInStock ?? 0);

      if (!catMap[catName]) {
        catMap[catName] = { name: catName, count: 0, stock: 0 };
      }
      catMap[catName].count += 1;
      catMap[catName].stock += stock;
    });
    const productsByCategory = Object.values(catMap);

    // Final Payload
    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalProducts: products.length,
          totalCategories: totalCategories || productsByCategory.length,
          totalUsers,
          totalStock,
          inventoryValue,
          inStock,
          lowStock,
          outOfStock,
        },
        productsByCategory,
        lowStockProducts,
        outOfStockProducts,
        recentProducts: formattedProducts.slice(-5).reverse(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
