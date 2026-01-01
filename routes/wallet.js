const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

/**
 * GET /wallet
 * - Returns user's wallet
 * - Auto-creates wallet if it does not exist
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Check if wallet exists
    const existing = await pool.query(
      "SELECT * FROM wallets WHERE user_id = $1",
      [userId]
    );

    // 2️⃣ Create wallet if missing
    if (existing.rows.length === 0) {
      const created = await pool.query(
        `INSERT INTO wallets (user_id, balance, pending)
         VALUES ($1, 0, 0)
         RETURNING *`,
        [userId]
      );

      return res.json(created.rows[0]);
    }

    // 3️⃣ Return existing wallet
    res.json(existing.rows[0]);

  } catch (err) {
    console.error("Wallet error:", err);
    res.status(500).json({ error: "Failed to load wallet" });
  }
});

module.exports = router;
