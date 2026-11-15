const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
} = require("../Controllers/productController");

// Routes
router.post("/create", createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
