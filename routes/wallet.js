const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

/**
 * GET /wallet
 * - Returns user's wallet
 * - Auto-creates wallet if it does not exist
 * - Includes bank verification status
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    /**
     * 1️⃣ Ensure wallet exists
     */
    const existingWallet = await pool.query(
      "SELECT * FROM wallets WHERE user_id = $1",
      [userId]
    );

    if (existingWallet.rows.length === 0) {
      await pool.query(
        `INSERT INTO wallets (user_id, balance, pending)
         VALUES ($1, 0, 0)`,
        [userId]
      );
    }

    /**
     * 2️⃣ Return wallet + bank info
     */
    const result = await pool.query(
      `
      SELECT
        w.id,
        w.balance,
        w.pending,
        w.created_at,
        u.bank_verified,
        u.bank_name,
        u.account_number,
        u.account_name
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      WHERE w.user_id = $1
      `,
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Wallet error:", err);
    res.status(500).json({ error: "Failed to load wallet" });
  }
});

module.exports = router;
