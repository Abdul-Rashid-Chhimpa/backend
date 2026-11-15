const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

dotenv.config();


const app = express();
app.set("trust proxy", 1); // Render proxy ke peeche

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
const ProductRoutes = require("./Routers/productRoutes");
// Upload Folder Creation
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS
const allowedOrigins = [
  "https://www.pedwal.in",
  "https://pedwal.in",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

// Mount Routes (specific routes pehle, generic "/api" wale baad me)
app.use("/api/banners", bannerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api", userRoutes);
app.use("/api", settingsRoutes);
app.use("/api", categoryRoutes);

// Test Route
app.get("/", (req, res) => {
  res.json({ success: true, message: "API Running" });
});
app.get('/health', (req, res) => {
  res.status(200).send('Server is active');
});

app.use("/api/products", ProductRoutes);
// Error handler (multer / cors errors yahan aayenge)
app.use((err, req, res, next) => {
  console.error(err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Image 5MB se chhoti honi chahiye" });
  }
  res.status(400).json({ message: err.message || "Something went wrong" });
});

// MongoDB Connection, phir server start
const PORT = process.env.PORT || 8080;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server Running On Port ${PORT}`));
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err);
    process.exit(1);
  });
