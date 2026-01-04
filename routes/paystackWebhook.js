const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const pool = require("../db");
const sendEmail = require("../utils/sendEmail");

/**
 * PAYSTACK WEBHOOK
 * - Verifies signature
 * - Confirms payment
 * - Auto completes escrow
 */
router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.PAYSTACK_SECRET_KEY;

      const hash = crypto
        .createHmac("sha512", secret)
        .update(req.body)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        return res.status(401).send("Invalid signature");
      }

      const event = JSON.parse(req.body.toString());

      // ✅ We only care about successful payments
      if (event.event !== "charge.success") {
        return res.sendStatus(200);
      }

      const reference = event.data.reference;

      // 🔎 Find order using Paystack reference
      const orderRes = await pool.query(
        `
        SELECT 
          o.id,
          o.status,
          o.amount,
          p.id AS property_id,
          p.title,
          b.email AS buyer_email,
          b.first_name AS buyer_name,
          s.email AS seller_email,
          s.first_name AS seller_name
        FROM orders o
        JOIN properties p ON p.id = o.property_id
        JOIN users b ON b.id = o.buyer_id
        JOIN users s ON s.id = o.seller_id
        WHERE o.paystack_reference = $1
        `,
        [reference]
      );

      if (!orderRes.rows.length) {
        return res.sendStatus(200);
      }

      const order = orderRes.rows[0];

      // ⛔ Already processed
      if (order.status !== "escrow_pending") {
        return res.sendStatus(200);
      }

      // ✅ COMPLETE ESCROW
      await pool.query(
        "UPDATE orders SET status = 'completed' WHERE id = $1",
        [order.id]
      );

      await pool.query(
        "UPDATE properties SET status = 'sold', sold_date = NOW() WHERE id = $1",
        [order.property_id]
      );

      // 📧 EMAIL SELLER
      await sendEmail({
        to: order.seller_email,
        subject: "Escrow Released – Funds Available",
        html: `
          <p>Hello ${order.seller_name},</p>
          <p>Your escrow payment for <strong>${order.title}</strong> has been released.</p>
          <p><strong>Amount:</strong> ₦${Number(order.amount).toLocaleString()}</p>
          <p>Funds are now available in your Middleman wallet.</p>
        `,
      });

      // 📧 EMAIL BUYER
      await sendEmail({
        to: order.buyer_email,
        subject: "Escrow Completed Successfully",
        html: `
          <p>Hello ${order.buyer_name},</p>
          <p>Your escrow transaction for <strong>${order.title}</strong> has been completed.</p>
          <p>Thank you for trusting Middleman.</p>
        `,
      });

      res.sendStatus(200);
    } catch (err) {
      console.error("PAYSTACK WEBHOOK ERROR:", err);
      res.sendStatus(500);
    }
  }
);

module.exports = router;
