const Product = require("../Models/productdb");// apna path check karo
const Category = require("../Models/Category");
const User = require("../Models/User"); // agar model naam alag ho to fix karo

const getLowestPrice = (product) => {
  if (product.pricing && product.pricing.length > 0) {
    return Math.min(
      ...product.pricing.map((p) => Number(p.price) || 0)
    );
  }
  return Number(product.price || 0);
};

const getAnalytics = async (req, res) => {
  try {
    const [products, categories, users] = await Promise.all([
      Product.find().lean(),
      Category.find().lean().catch(() => []),
      User.find().lean().catch(() => []),
    ]);

    const totalProducts = products.length;
    const totalCategories = categories.length;
    const totalUsers = users.length;

    let totalStock = 0;
    let outOfStock = 0;
    let lowStock = 0; // stock > 0 && stock <= 20
    let inventoryValue = 0; // stock * lowest unit price

    const categoryMap = {};
    const brandMap = {};
    const stockByCategory = {};

    products.forEach((p) => {
      const stock = Number(p.stock) || 0;
      const price = getLowestPrice(p);

      totalStock += stock;
      inventoryValue += stock * price;

      if (stock === 0) outOfStock += 1;
      else if (stock <= 20) lowStock += 1;

      const cat = p.category || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      stockByCategory[cat] = (stockByCategory[cat] || 0) + stock;

      const brand = p.brand || "Unknown";
      brandMap[brand] = (brandMap[brand] || 0) + 1;
    });

    // Top categories by product count
    const productsByCategory = Object.entries(categoryMap)
      .map(([name, count]) => ({
        name,
        count,
        stock: stockByCategory[name] || 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Top brands
    const productsByBrand = Object.entries(brandMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Low stock products list
    const lowStockProducts = products
      .filter((p) => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 20)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        stock: p.stock,
        category: p.category,
        brand: p.brand,
        price: getLowestPrice(p),
      }))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10);

    // Out of stock list
    const outOfStockProducts = products
      .filter((p) => (Number(p.stock) || 0) === 0)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        brand: p.brand,
      }))
      .slice(0, 10);

    // Recent products
    const recentProducts = [...products]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      .slice(0, 8)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        stock: p.stock,
        price: getLowestPrice(p),
        image: p.images?.[0] || "",
        createdAt: p.createdAt,
      }));

    // Active users
    const activeUsers = users.filter(
      (u) => !u.status || u.status === "active"
    ).length;

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalProducts,
          totalCategories,
          totalUsers,
          activeUsers,
          totalStock,
          outOfStock,
          lowStock,
          inStock: totalProducts - outOfStock,
          inventoryValue: Math.round(inventoryValue),
        },
        productsByCategory,
        productsByBrand,
        lowStockProducts,
        outOfStockProducts,
        recentProducts,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load analytics",
      error: error.message,
    });
  }
};

module.exports = { getAnalytics };
