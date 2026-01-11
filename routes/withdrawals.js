const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const auditLog = require("../utils/auditLog");
const axios = require("axios");
const banks = require("../utils/banks");

/**
 * POST /withdrawals/request
 * Seller requests withdrawal
 */
router.post("/request", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    await client.query("BEGIN");

    // 1️⃣ Lock wallet
    const walletRes = await client.query(
      `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [userId]
    );

    if (!walletRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Wallet not found" });
    }

    const wallet = walletRes.rows[0];

    if (Number(wallet.balance) < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // 2️⃣ Bank details snapshot
    const bankRes = await client.query(
      `
      SELECT bank_name, account_number, account_name
      FROM users
      WHERE id = $1 AND bank_verified = true
      `,
      [userId]
    );

    if (!bankRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "No verified bank details found"
      });
    }

    const bank = bankRes.rows[0];

    // 3️⃣ Create withdrawal
    await client.query(
      `
      INSERT INTO withdrawals
        (user_id, amount, bank_name, account_number, account_name)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        userId,
        amount,
        bank.bank_name,
        bank.account_number,
        bank.account_name
      ]
    );

    // 4️⃣ Move balance → pending
    await client.query(
      `
      UPDATE wallets
      SET
        balance = balance - $1,
        pending = pending + $1,
        updated_at = NOW()
      WHERE user_id = $2
      `,
      [amount, userId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Withdrawal requested successfully"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Withdrawal request error:", err);
    res.status(500).json({ error: "Withdrawal failed" });
  } finally {
    client.release();
  }
});

/**
 * GET /withdrawals/mine
 */
router.get("/mine", auth, async (req, res) => {
  const result = await pool.query(
    `
    SELECT *
    FROM withdrawals
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [req.user.id]
  );

  res.json(result.rows);
});

/**
 * ADMIN: PENDING WITHDRAWALS
 */
router.get("/admin/pending", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const result = await pool.query(
    `
    SELECT w.*, u.email
    FROM withdrawals w
    JOIN users u ON u.id = w.user_id
    WHERE w.status = 'pending'
    ORDER BY w.created_at ASC
    `
  );

  res.json(result.rows);
});

/**
 * ADMIN APPROVE WITHDRAWAL → PAYSTACK PAYOUT
 */
router.patch("/:id/approve", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { id } = req.params;
    await client.query("BEGIN");

    // 1️⃣ Lock withdrawal
    const wRes = await client.query(
      `
      SELECT w.*, u.paystack_recipient_code
      FROM withdrawals w
      JOIN users u ON u.id = w.user_id
      WHERE w.id = $1 AND w.status = 'pending'
      FOR UPDATE
      `,
      [id]
    );

    if (!wRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid withdrawal" });
    }

    const withdrawal = wRes.rows[0];
    let recipientCode = withdrawal.paystack_recipient_code;

    // 2️⃣ Create recipient ONCE if missing
    if (!recipientCode) {
      const recipientRes = await axios.post(
        "https://api.paystack.co/transferrecipient",
        {
          type: "nuban",
          name: withdrawal.account_name,
          account_number: withdrawal.account_number,
          bank_code: banks[withdrawal.bank_name],
          currency: "NGN"
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      recipientCode = recipientRes.data.data.recipient_code;

      await client.query(
        `UPDATE users SET paystack_recipient_code = $1 WHERE id = $2`,
        [recipientCode, withdrawal.user_id]
      );
    }

    // 3️⃣ Initiate Paystack transfer
    const transferRes = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: Math.round(Number(withdrawal.amount) * 100),
        recipient: recipientCode,
        reason: "Middleman seller payout"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    // 4️⃣ Mark approved (final settlement via webhook)
    await client.query(
      `
      UPDATE withdrawals
      SET
        status = 'approved',
        paystack_reference = $1,
        processed_at = NOW()
      WHERE id = $2
      `,
      [transferRes.data.data.reference, withdrawal.id]
    );

    await auditLog({
      adminId: req.user.id,
      action: "withdrawal_payout",
      entityType: "withdrawal",
      entityId: id
    });

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Withdrawal approved and payout initiated",
      reference: transferRes.data.data.reference
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("PAYSTACK PAYOUT ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Payout failed" });
  } finally {
    client.release();
  }
});

/**
 * ADMIN REJECT WITHDRAWAL
 */
router.patch("/:id/reject", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { id } = req.params;
    await client.query("BEGIN");

    const wRes = await client.query(
      `
      SELECT *
      FROM withdrawals
      WHERE id = $1 AND status = 'pending'
      FOR UPDATE
      `,
      [id]
    );

    if (!wRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid withdrawal" });
    }

    const withdrawal = wRes.rows[0];

    await client.query(
      `
      UPDATE withdrawals
      SET status = 'rejected', processed_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    await client.query(
      `
      UPDATE wallets
      SET
        balance = balance + $1,
        pending = pending - $1,
        updated_at = NOW()
      WHERE user_id = $2
      `,
      [withdrawal.amount, withdrawal.user_id]
    );

    await client.query("COMMIT");

    await auditLog({
      adminId: req.user.id,
      action: "reject_withdrawal",
      entityType: "withdrawal",
      entityId: id
    });

    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Rejection failed" });
  } finally {
    client.release();
  }
});

module.exports = router;
