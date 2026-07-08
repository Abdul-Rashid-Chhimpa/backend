const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const fs = require("fs");
const orderRoutes = require("./Routers/orderRoutes");
dotenv.config();
const path = require("path");

const app = express();

// Upload Folder
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Middleware
app.use(
  cors({
    // origin:"https://frontend-vp6t.vercel.app",
    origin:"https://pedwaltools.netlify.app",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Static Folder
// app.use(
//   "/uploads",
//   express.static("uploads")
// );

// Routes
const authRoutes = require("./Routers/authRoutes");
const productRoutes = require("./Routers/Router");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);


app.use("/api/orders", orderRoutes);

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    console.log("MongoDB Connected")
  )
  .catch((err) =>
    console.log(err)
  );

// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Running",
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(
    `Server Running On Port ${PORT}`
  );
});
