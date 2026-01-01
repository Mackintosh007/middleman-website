const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * ===============================
 * ADMIN REVENUE DASHBOARD
 * ===============================
 */
router.get(
  "/revenue",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      // Escrow revenue (automatic)
      const escrowStats = await pool.query(`
        SELECT
          COUNT(*) AS total_orders,
          COALESCE(SUM(amount), 0) AS total_volume,
          COALESCE(SUM(platform_fee), 0) AS platform_fees,
          COALESCE(SUM(delivery_fee), 0) AS delivery_fees
        FROM orders
        WHERE status IN ('funds_held', 'completed')
      `);

      // Commission revenue (manual / offline)
      const commissionStats = await pool.query(`
        SELECT
          COUNT(*) AS total_deals,
          COALESCE(SUM(commission_amount), 0) AS total_commission,
          COALESCE(SUM(
            CASE WHEN status = 'paid'
            THEN commission_amount ELSE 0 END
          ), 0) AS paid_commission
        FROM commissions
      `);

      res.json({
        escrow: escrowStats.rows[0],
        commission: commissionStats.rows[0],
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * ===============================
 * ADMIN — GET ALL ORDERS
 * ===============================
 */
router.get(
  "/orders",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT *
        FROM orders
        ORDER BY created_at DESC
      `);

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * ===============================
 * ADMIN — RELEASE ESCROW FUNDS
 * ===============================
 * Buyer already paid: price + delivery
 * Seller pays: 6.5% commission
 * Platform keeps: delivery + commission
 */
router.post(
  "/orders/:id/release",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const orderRes = await pool.query(
        `SELECT *
         FROM orders
         WHERE id = $1`,
        [id]
      );

      if (!orderRes.rows.length) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderRes.rows[0];

      if (order.status !== "funds_held") {
        return res.status(400).json({
          error: "Funds cannot be released at this stage",
        });
      }

      // Seller payout calculation
      const sellerPayout =
        Number(order.amount) - Number(order.platform_fee);

      // Update seller wallet
      await pool.query(
        `INSERT INTO wallets (user_id, balance)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE SET
           balance = wallets.balance + $2,
           updated_at = NOW()`,
        [order.seller_id, sellerPayout]
      );

      // Mark order completed
      await pool.query(
        `UPDATE orders
         SET status = 'completed',
             released_at = NOW()
         WHERE id = $1`,
        [id]
      );

      res.json({
        message: "Funds released successfully",
        seller_payout: sellerPayout,
        platform_earnings:
          Number(order.platform_fee) +
          Number(order.delivery_fee),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
