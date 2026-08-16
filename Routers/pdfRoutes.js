const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Example route: PDF Download
router.get("/download-pdf", async (req, res) => {
  try {
    // Apni file ka actual path pass karein
    const filePath = path.join(__dirname, "../files/sample.pdf");

    // Check agar file exist karti hai
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Headers set karein taaki browser isko download stream ki tarah handle kare
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="Order_Receipt.pdf"');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("PDF Download Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
