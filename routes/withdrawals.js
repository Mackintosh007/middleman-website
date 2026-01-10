const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const auditLog = require("../utils/auditLog");

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

    // 1️⃣ Lock wallet row
    const walletRes = await client.query(
      `
      SELECT *
      FROM wallets
      WHERE user_id = $1
      FOR UPDATE
      `,
      [userId]
    );

    if (walletRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Wallet not found" });
    }

    const wallet = walletRes.rows[0];

    if (Number(wallet.balance) < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // 2️⃣ Load user's bank details (snapshot)
    const bankRes = await pool.query(
      `
      SELECT bank_name, account_number, account_name
      FROM users
      WHERE id = $1 AND bank_verified = true
      `,
      [userId]
    );

    if (bankRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "No bank details found. Please add bank details first."
      });
    }

    const bank = bankRes.rows[0];

    // 3️⃣ Create withdrawal request
    await client.query(
      `
      INSERT INTO withdrawals (
        user_id,
        amount,
        bank_name,
        account_number,
        account_name
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        userId,
        amount,
        bank.bank_name,
        bank.account_number,
        bank.account_name
      ]
    );

    // 4️⃣ Move money: balance → pending
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
  try {
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
  } catch (err) {
    res.status(500).json({ error: "Failed to load withdrawals" });
  }
});

/**
 * ADMIN: PENDING WITHDRAWALS
 */
router.get("/admin/pending", auth, async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: "Failed to load withdrawals" });
  }
});

/**
 * ADMIN APPROVE WITHDRAWAL
 */
router.patch("/:id/approve", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE withdrawals
      SET status = 'approved',
          processed_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: "Invalid withdrawal" });
    }

    await auditLog({
      adminId: req.user.id,
      action: "approve_withdrawal",
      entityType: "withdrawal",
      entityId: id
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Approval failed" });
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

    const withdrawalRes = await client.query(
      `
      SELECT *
      FROM withdrawals
      WHERE id = $1 AND status = 'pending'
      FOR UPDATE
      `,
      [id]
    );

    if (!withdrawalRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid withdrawal" });
    }

    const withdrawal = withdrawalRes.rows[0];

    await client.query(
      `
      UPDATE withdrawals
      SET status = 'rejected',
          processed_at = NOW()
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
