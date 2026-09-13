const express = require("express");
const router = express.Router();
const axios = require("axios");

// Read process.env directly inside request or trim values
const getEnvVars = () => {
  const CASHFREE_APP_ID = (process.env.CASHFREE_APP_ID || "").trim();
  const CASHFREE_SECRET_KEY = (process.env.CASHFREE_SECRET_KEY || "").trim();
  const CASHFREE_ENV = (process.env.CASHFREE_ENV || "PROD").trim();

  const BASE_URL =
    CASHFREE_ENV === "PROD"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

  return { CASHFREE_APP_ID, CASHFREE_SECRET_KEY, BASE_URL };
};

// Create Order & Get payment_session_id
router.post("/create-session", async (req, res) => {
  try {
    const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY, BASE_URL } = getEnvVars();

    // Check if credentials exist
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error("ERROR: Cashfree Credentials missing in process.env");
      return res.status(500).json({
        success: false,
        message: "Server Configuration Error: Cashfree keys are missing.",
      });
    }

    const { amount, customerId, customerPhone, customerName, customerEmail } = req.body;

    // Sanitize phone number (Keep exact last 10 digits)
    const rawPhone = String(customerPhone || "9999999999").replace(/\D/g, "");
    const formattedPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : "9999999999";

    const orderData = {
      order_id: "order_" + Date.now(),
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: String(customerId || "cust_" + Date.now()),
        customer_name: customerName || "Customer",
        customer_email: customerEmail || "customer@pedwal.in",
        customer_phone: formattedPhone,
      },
      order_meta: {
        return_url: "https://www.pedwal.in/order-status?order_id={order_id}",
      },
    };

    const response = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
    });

    res.status(200).json({
      success: true,
      payment_session_id: response.data.payment_session_id,
      order_id: response.data.order_id,
    });
  } catch (error) {
    console.error("Cashfree Session Error Response:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create payment session",
      error: error.response?.data || error.message,
    });
  }
});

// Verify Payment Status
router.get("/verify/:orderId", async (req, res) => {
  try {
    const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY, BASE_URL } = getEnvVars();
    const { orderId } = req.params;

    const response = await axios.get(`${BASE_URL}/orders/${orderId}`, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
