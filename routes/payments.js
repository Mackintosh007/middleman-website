const express = require("express");
const router = express.Router();
const axios = require("axios");
const pool = require("../db");
const auth = require("../middleware/auth");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

/**
 * Initialize Paystack payment
 */
router.post("/initialize", auth, async (req, res) => {
  try {
    const { order_id } = req.body;

    const orderRes = await pool.query(
      `SELECT o.*, u.email
       FROM orders o
       JOIN users u ON u.id = o.buyer_id
       WHERE o.id = $1`,
      [order_id]
    );

    if (!orderRes.rows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];

    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: order.email,
        amount: Math.round(order.total_amount * 100), // kobo
        metadata: {
          order_id: order.id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    res.json({
      authorization_url: paystackRes.data.data.authorization_url,
    });
  } catch (err) {
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

module.exports = router;
