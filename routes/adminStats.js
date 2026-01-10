const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * ADMIN DASHBOARD STATS
 * GET /api/admin/stats
 */
router.get(
  "/stats",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const [
        unverifiedUsers,
        pendingSellerRequests,
        pendingServiceRequests, // ✅ ADDED
        pendingWithdrawals,
        pendingOrders
      ] = await Promise.all([
        pool.query(
          "SELECT COUNT(*) FROM users WHERE verified = false"
        ),
        pool.query(
          "SELECT COUNT(*) FROM seller_requests WHERE status = 'pending'"
        ),
        pool.query(
          "SELECT COUNT(*) FROM services WHERE status = 'pending'" // ✅ ADDED
        ),
        pool.query(
          "SELECT COUNT(*) FROM withdrawals WHERE status = 'pending'"
        ),
        pool.query(
          "SELECT COUNT(*) FROM orders WHERE status = 'pending'"
        )
      ]);

      res.json({
        users: Number(unverifiedUsers.rows[0].count),
        seller_requests: Number(pendingSellerRequests.rows[0].count),
        service_requests: Number(pendingServiceRequests.rows[0].count), // ✅ ADDED
        withdrawals: Number(pendingWithdrawals.rows[0].count),
        orders: Number(pendingOrders.rows[0].count)
      });
    } catch (err) {
      console.error("ADMIN STATS ERROR:", err);
      res.status(500).json({ error: "Failed to load admin stats" });
    }
  }
);

module.exports = router;
