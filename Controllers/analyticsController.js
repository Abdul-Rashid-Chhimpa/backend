const Product = require("../Models/productdb");
const User = require("../Models/User");
const Category = require("../Models/Category");

exports.getAnalytics = async (req, res) => {
  try {
    const products = await Product.find({});

    let totalStock = 0;
    let inventoryValue = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    const lowStockProducts = [];
    const outOfStockProducts = [];

    const formattedProducts = products.map((prod) => {
      // Stock Fallback Handling
      const currentStock = Number(prod.stock ?? prod.countInStock ?? prod.quantity ?? 0);
      
      // Price Fallback Handling (Aggressive Parsing)
      const price = Number(prod.price ?? prod.unitPrice ?? prod.cost ?? 0);

      totalStock += currentStock;
      inventoryValue += currentStock * price;

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
        price: price, // Enforces Price is returned properly
      };
    });

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalProducts: products.length,
          totalStock,
          inventoryValue,
          inStock,
          lowStock,
          outOfStock,
        },
        lowStockProducts,
        outOfStockProducts,
        recentProducts: formattedProducts.slice(-5).reverse(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
