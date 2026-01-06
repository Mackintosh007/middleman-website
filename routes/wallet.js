const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

/**
 * GET /wallet
 * Safe, non-crashing wallet loader
 */
router.get("/", auth, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1️⃣ Ensure wallet exists
    const walletRes = await pool.query(
      "SELECT * FROM wallets WHERE user_id = $1",
      [userId]
    );

    if (walletRes.rows.length === 0) {
      await pool.query(
        `INSERT INTO wallets (user_id, balance, pending)
         VALUES ($1, 0, 0)`,
        [userId]
      );
    }

    // 2️⃣ Fetch wallet + bank status (SAFE)
    const dataRes = await pool.query(
      `
      SELECT
        w.balance,
        w.pending,
        COALESCE(u.bank_verified, false) AS bank_verified
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      WHERE w.user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (dataRes.rows.length === 0) {
      return res.json({
        balance: 0,
        pending: 0,
        bank_verified: false
      });
    }

    res.json(dataRes.rows[0]);

  } catch (err) {
    console.error("WALLET LOAD FAILED:", err.message);
    res.status(500).json({
      balance: 0,
      pending: 0,
      bank_verified: false
    });
  }
});

module.exports = router;
