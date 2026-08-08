const Category = require("../Models/Category");

// GET all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// GET single category
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

// CREATE category
const createCategory = async (req, res) => {
  try {
    const { name, description, image, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || "",
      image: image || "",
      status: status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: error.code === 11000 ? "Category already exists" : "Failed to create category",
      error: error.message,
    });
  }
};

// UPDATE category
const updateCategory = async (req, res) => {
  try {
    const { name, description, image, status } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name && name.trim()) {
      const exists = await Category.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Another category with this name exists",
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (status) category.status = status;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

// DELETE category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
