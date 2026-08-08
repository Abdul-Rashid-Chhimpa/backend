const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // Store Info
    storeName: { type: String, default: "Pedwal Life Creation" },
    storeEmail: { type: String, default: "" },
    storePhone: { type: String, default: "" },
    storeAddress: { type: String, default: "" },
    storeCity: { type: String, default: "" },
    storeState: { type: String, default: "" },
    storePincode: { type: String, default: "" },
    storeCountry: { type: String, default: "India" },

    // Social
    whatsapp: { type: String, default: "" },
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },

    // Shipping
    shippingCharge: { type: Number, default: 50 },
    freeShippingAbove: { type: Number, default: 999 },

    // Tax
    gstPercent: { type: Number, default: 18 },

    // Stock
    lowStockThreshold: { type: Number, default: 10 },

    // Payment
    codEnabled: { type: Boolean, default: true },
    onlinePaymentEnabled: { type: Boolean, default: false },

    // Site
    maintenanceMode: { type: Boolean, default: false },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
