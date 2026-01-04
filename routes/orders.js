const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const sendEmail = require("../utils/sendEmail");
const axios = require("axios");

const PLATFORM_FEE_PERCENT = 6.5;
const DELIVERY_FEE = 800;

/**
 * ===============================
 * CREATE ESCROW ORDER
 * ===============================
 */
router.post(
  "/",
  auth,
  roles("customer", "agent", "individual_seller", "admin"),
  async (req, res) => {
    try {
      const { property_id } = req.body;

      const propRes = await pool.query(
        `SELECT id, owner_id, price, status, revenue_type
         FROM properties WHERE id = $1`,
        [property_id]
      );

      if (!propRes.rows.length) {
        return res.status(404).json({ error: "Listing not found" });
      }

      const property = propRes.rows[0];

      if (property.revenue_type !== "escrow") {
        return res.status(403).json({
          error: "This listing does not support escrow",
        });
      }

      if (property.status !== "active") {
        return res.status(400).json({
          error: "Listing is not active",
        });
      }

      if (property.owner_id === req.user.id) {
        return res.status(403).json({
          error: "You cannot buy your own listing",
        });
      }

      const platformFee = Number(
        ((property.price * PLATFORM_FEE_PERCENT) / 100).toFixed(2)
      );

      const deliveryFee = DELIVERY_FEE;
      const totalAmount = property.price + deliveryFee;

      const orderRes = await pool.query(
        `
        INSERT INTO orders
        (property_id, buyer_id, seller_id, amount, platform_fee, delivery_fee, total_amount, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
        RETURNING *
        `,
        [
          property.id,
          req.user.id,
          property.owner_id,
          property.price,
          platformFee,
          deliveryFee,
          totalAmount,
        ]
      );

      await pool.query(
        "UPDATE properties SET status = 'pending' WHERE id = $1",
        [property.id]
      );

      res.status(201).json(orderRes.rows[0]);
    } catch (err) {
      console.error("ESCROW CREATE ERROR:", err);
      res.status(500).json({ error: "Unable to create escrow order" });
    }
  }
);

/**
 * ===============================
 * INITIATE PAYSTACK PAYMENT
 * ===============================
 */
router.post("/:id/pay", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const orderRes = await pool.query(
      `
      SELECT o.id, o.total_amount, o.status, u.email AS buyer_email
      FROM orders o
      JOIN users u ON u.id = o.buyer_id
      WHERE o.id = $1
      `,
      [id]
    );

    if (!orderRes.rows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];

    if (order.status !== "pending") {
      return res.status(400).json({
        error: "Order cannot be paid for",
      });
    }

    const paystackAmount = Math.round(
      Number(order.total_amount) * 100
    );

    const payRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: order.buyer_email,
        amount: paystackAmount,
        reference: `MM_ESCROW_${order.id}_${Date.now()}`,
        callback_url: `${process.env.FRONTEND_URL}/payment-success`,
        metadata: {
          order_id: order.id,
          escrow: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Mark order as PAID once Paystack is initialized
    await pool.query(
      "UPDATE orders SET status = 'paid' WHERE id = $1",
      [order.id]
    );

    res.json({
      authorization_url: payRes.data.data.authorization_url,
    });
  } catch (err) {
    console.error("PAYSTACK INIT ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Unable to initiate payment" });
  }
});

/**
 * ===============================
 * SELLER MARK DELIVERY
 * ===============================
 */
router.patch(
  "/:id/mark-delivered",
  auth,
  roles("agent", "individual_seller", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const orderRes = await pool.query(
        `
        SELECT id, seller_id, status, delivery_confirmed
        FROM orders
        WHERE id = $1
        `,
        [id]
      );

      if (!orderRes.rows.length) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderRes.rows[0];

      if (
        order.seller_id !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          error: "Unauthorized",
        });
      }

      if (order.status !== "paid") {
        return res.status(400).json({
          error: "Order must be paid before delivery",
        });
      }

      if (order.delivery_confirmed) {
        return res.status(400).json({
          error: "Delivery already marked",
        });
      }

      await pool.query(
        `
        UPDATE orders
        SET delivery_confirmed = true
        WHERE id = $1
        `,
        [id]
      );

      res.json({
        success: true,
        message: "Delivery marked successfully",
      });
    } catch (err) {
      console.error("MARK DELIVERY ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * ===============================
 * BUYER CONFIRM DELIVERY (ESCROW RELEASE)
 * ===============================
 */
router.patch("/:id/confirm-delivery", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const orderRes = await pool.query(
      `
      SELECT 
        o.*,
        p.id AS property_id,
        p.title,
        s.id AS seller_id,
        s.email AS seller_email,
        s.first_name AS seller_name,
        b.email AS buyer_email,
        b.first_name AS buyer_name
      FROM orders o
      JOIN properties p ON p.id = o.property_id
      JOIN users s ON s.id = o.seller_id
      JOIN users b ON b.id = o.buyer_id
      WHERE o.id = $1
      `,
      [id]
    );

    if (!orderRes.rows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];

    if (order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (order.status !== "paid" || !order.delivery_confirmed) {
      return res.status(400).json({
        error: "Delivery not yet completed",
      });
    }

    const sellerPayout =
      Number(order.amount) - Number(order.platform_fee);

    await pool.query(
      `
      UPDATE orders
      SET status = 'completed', released_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    await pool.query(
      "UPDATE properties SET status = 'sold', sold_date = NOW() WHERE id = $1",
      [order.property_id]
    );

    await pool.query(
      "UPDATE wallets SET balance = balance + $1 WHERE user_id = $2",
      [sellerPayout, order.seller_id]
    );

    await sendEmail({
      to: order.seller_email,
      subject: "Escrow Released – Funds Available",
      html: `
        <p>Hello ${order.seller_name},</p>
        <p>Your escrow funds for <strong>${order.title}</strong> have been released.</p>
        <p><strong>Amount:</strong> ₦${sellerPayout.toLocaleString()}</p>
      `,
    });

    await sendEmail({
      to: order.buyer_email,
      subject: "Delivery Confirmed",
      html: `
        <p>Hello ${order.buyer_name},</p>
        <p>You have successfully confirmed delivery for <strong>${order.title}</strong>.</p>
      `,
    });

    res.json({
      success: true,
      message: "Escrow released successfully",
    });
  } catch (err) {
    console.error("CONFIRM DELIVERY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ===============================
 * ADMIN FORCE COMPLETE (DISPUTES)
 * ===============================
 */
router.patch(
  "/:id/complete",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      await pool.query(
        "UPDATE orders SET status = 'completed' WHERE id = $1",
        [req.params.id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
