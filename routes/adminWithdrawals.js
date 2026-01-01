const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const axios = require("axios");

/**
 * ADMIN: View pending withdrawals
 */
router.get(
  "/withdrawals",
  auth,
  roles("admin"),
  async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM withdrawals WHERE status = 'pending'"
    );
    res.json(result.rows);
  }
);

/**
 * ADMIN: Approve & Pay withdrawal
 */
router.post(
  "/withdrawals/:id/pay",
  auth,
  roles("admin"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const wRes = await client.query(
        "SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE",
        [req.params.id]
      );

      if (!wRes.rows.length) {
        throw new Error("Withdrawal not found");
      }

      const w = wRes.rows[0];

      if (w.status !== "pending") {
        throw new Error("Withdrawal already processed");
      }

      // 🔁 PAYSTACK TRANSFER (SIMPLIFIED)
      await axios.post(
        "https://api.paystack.co/transfer",
        {
          source: "balance",
          amount: Math.round(w.amount * 100),
          recipient: {
            type: "nuban",
            name: w.account_name,
            account_number: w.account_number,
            bank_code: "058", // example: GTBank
            currency: "NGN"
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      // Deduct wallet balance
      await client.query(
        `UPDATE wallets
         SET balance = balance - $1
         WHERE user_id = $2`,
        [w.amount, w.user_id]
      );

      // Mark withdrawal paid
      await client.query(
        `UPDATE withdrawals
         SET status = 'paid',
             processed_at = NOW()
         WHERE id = $1`,
        [w.id]
      );

      await client.query("COMMIT");
      res.json({ message: "Withdrawal paid successfully" });

    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
