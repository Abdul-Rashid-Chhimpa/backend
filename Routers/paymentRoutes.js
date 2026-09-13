const express = require("express");
const router = express.Router();
const axios = require("axios");

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || "PROD"; // "PROD" or "SANDBOX"

const BASE_URL =
  CASHFREE_ENV === "PROD"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

// Create Order & Get payment_session_id
router.post("/create-session", async (req, res) => {
  try {
    const { amount, customerId, customerPhone, customerName, customerEmail } = req.body;

    const orderData = {
      order_id: "order_" + Date.now(),
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId || "cust_" + Date.now(),
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
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
    console.error("Cashfree Session Error:", error.response?.data || error.message);
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
    });
  }
});

module.exports = router;
