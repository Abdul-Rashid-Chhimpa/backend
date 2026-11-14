const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();

// Import Routes
const userRoutes = require("./Routers/userRoutes");
const settingsRoutes = require("./Routers/settingsRoutes");
const categoryRoutes = require("./Routers/categoryRoutes");
const analyticsRoutes = require("./Routers/analyticsRoutes");
const paymentRoutes = require("./Routers/paymentRoutes");
const bannerRoutes = require("./Routers/bannerRoutes");
const authRoutes = require("./Routers/authRoutes");
const productRoutes = require("./Routers/Router");
const orderRoutes = require("./Routers/orderRoutes");

// Upload Folder Creation
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Middleware
app.use(
  cors({
    origin: "https://www.pedwal.in",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", userRoutes);
app.use("/api/users", userRoutes);
app.use("/api", settingsRoutes);
app.use("/api", categoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/banners", bannerRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Running",
  });
});

// Port & Server Startup
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server Running On Port ${PORT}`);
});
