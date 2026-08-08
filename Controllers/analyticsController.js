const Product = require("../models/productdb");
const User = require("../models/User");
const Category = require("../models/Category");

exports.getAnalytics = async (req, res) => {
  try {
    const products = await Product.find({});
    const totalUsers = await User.countDocuments({});
    const totalCategories = await Category.countDocuments({});

    // Dynamic Calculations directly from DB products
    let totalProducts = products.length;
    let totalStock = 0;
    let inventoryValue = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    const lowStockProducts = [];
    const outOfStockProducts = [];

    products.forEach((prod) => {
      // Stock value field normalize karein (stock / countInStock)
      const currentStock = Number(prod.stock ?? prod.countInStock ?? 0);
      const price = Number(prod.price ?? 0);

      totalStock += currentStock;
      inventoryValue += currentStock * price;

      if (currentStock === 0) {
        outOfStock += 1;
        outOfStockProducts.push(prod);
      } else if (currentStock <= 20) {
        lowStock += 1;
        lowStockProducts.push(prod);
      } else {
        inStock += 1;
      }
    });

    // Group Products by Category
    const categoryMap = {};
    products.forEach((p) => {
      const catName = p.category?.name || p.category || "Uncategorized";
      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, count: 0, stock: 0 };
      }
      categoryMap[catName].count += 1;
      categoryMap[catName].stock += Number(p.stock ?? p.countInStock ?? 0);
    });

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalProducts,
          totalCategories,
          totalUsers,
          totalStock,
          inventoryValue,
          inStock,
          lowStock,
          outOfStock,
        },
        productsByCategory: Object.values(categoryMap),
        productsByBrand: [], // optional
        lowStockProducts,
        outOfStockProducts,
        recentProducts: products.slice(-5).reverse(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
