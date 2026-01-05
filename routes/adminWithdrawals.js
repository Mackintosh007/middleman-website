const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const axios = require("axios");

/**
 * ===============================
 * ADMIN: VIEW PENDING WITHDRAWALS
 * ===============================
 * GET /api/admin/withdrawals
 */
router.get(
  "/",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM withdrawals WHERE status = 'pending' ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * ===============================
 * ADMIN: APPROVE & PAY WITHDRAWAL
 * ===============================
 * POST /api/admin/withdrawals/:id/pay
 */
router.post(
  "/:id/pay",
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
          amount: Math.round(Number(w.amount) * 100),
          recipient: {
            type: "nuban",
            name: w.account_name,
            account_number: w.account_number,
            bank_code: w.bank_code || "058", // fallback GTBank
            currency: "NGN",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Deduct wallet balance
      await client.query(
        `
        UPDATE wallets
        SET balance = balance - $1
        WHERE user_id = $2
        `,
        [w.amount, w.user_id]
      );

      // Mark withdrawal as paid
      await client.query(
        `
        UPDATE withdrawals
        SET status = 'paid',
            processed_at = NOW()
        WHERE id = $1
        `,
        [w.id]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Withdrawal paid successfully",
      });

    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
