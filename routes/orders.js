const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const sendEmail = require("../utils/sendEmail");

const PLATFORM_FEE_PERCENT = 6.5;
const DELIVERY_FEE = 1300;

/**
 * CREATE ESCROW ORDER
 * - Any authenticated user can buy (except owner)
 * - Uses DB-allowed status
 */
router.post(
  "/",
  auth,
  roles("customer", "agent", "individual_seller", "admin"),
  async (req, res) => {
    try {
      const { property_id } = req.body;

      const propRes = await pool.query(
        `SELECT id, owner_id, price, status, revenue_type, title
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

      // ✅ IMPORTANT: use DB-allowed status
      const orderRes = await pool.query(
        `INSERT INTO orders
         (property_id, buyer_id, seller_id, amount, platform_fee, delivery_fee, total_amount, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
         RETURNING *`,
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

      // 🔒 Lock listing
      await pool.query(
        "UPDATE properties SET status = 'pending' WHERE id = $1",
        [property.id]
      );

      res.status(201).json(orderRes.rows[0]);
    } catch (err) {
      console.error("ESCROW CREATE ERROR:", err);
      res.status(500).json({ error: "Unable to start escrow payment" });
    }
  }
);

/**
 * 🔓 COMPLETE ESCROW (ADMIN ONLY)
 * - Releases escrow
 * - Credits seller wallet
 * - Sends confirmation emails
 */
router.patch(
  "/:id/complete",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const orderRes = await pool.query(
        `
        SELECT 
          o.id,
          o.amount,
          o.platform_fee,
          o.status,
          p.title,
          p.id AS property_id,
          b.email AS buyer_email,
          b.first_name AS buyer_name,
          s.id AS seller_id,
          s.email AS seller_email,
          s.first_name AS seller_name
        FROM orders o
        JOIN properties p ON p.id = o.property_id
        JOIN users b ON b.id = o.buyer_id
        JOIN users s ON s.id = o.seller_id
        WHERE o.id = $1
        `,
        [id]
      );

      if (!orderRes.rows.length) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderRes.rows[0];

      if (order.status !== "pending") {
        return res.status(400).json({ error: "Escrow is not pending" });
      }

      const sellerPayout =
        Number(order.amount) - Number(order.platform_fee);

      await pool.query(
        "UPDATE orders SET status = 'completed' WHERE id = $1",
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
          <p>Your escrow payment for <strong>${order.title}</strong> has been released.</p>
          <p><strong>Amount credited:</strong> ₦${sellerPayout.toLocaleString()}</p>
          <p>Funds are now available in your Middleman wallet.</p>
          <p>— Middleman Team</p>
        `,
      });

      await sendEmail({
        to: order.buyer_email,
        subject: "Escrow Completed Successfully",
        html: `
          <p>Hello ${order.buyer_name},</p>
          <p>Your escrow transaction for <strong>${order.title}</strong> has been completed.</p>
          <p><strong>Amount Paid:</strong> ₦${Number(order.amount).toLocaleString()}</p>
          <p>Thank you for trusting Middleman.</p>
          <p>— Middleman Team</p>
        `,
      });

      res.json({
        success: true,
        message: "Escrow completed & seller credited successfully",
      });
    } catch (err) {
      console.error("ESCROW COMPLETE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
