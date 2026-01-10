const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const auditLog = require("../utils/auditLog");

/**
 * ===============================
 * POST /withdrawals/request
 * Seller requests withdrawal
 * ===============================
 */
router.post("/request", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    /* ===============================
       1️⃣ LOAD WALLET
    =============================== */
    const walletRes = await pool.query(
      `SELECT balance FROM wallets WHERE user_id = $1`,
      [userId]
    );

    if (walletRes.rows.length === 0) {
      return res.status(400).json({ error: "Wallet not found" });
    }

    const walletBalance = Number(walletRes.rows[0].balance);

    if (walletBalance < Number(amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    /* ===============================
       2️⃣ LOAD BANK DETAILS (FROM USERS ✅)
    =============================== */
    const bankRes = await pool.query(
      `
      SELECT
        bank_name,
        account_number,
        account_name,
        bank_verified
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (
      bankRes.rows.length === 0 ||
      !bankRes.rows[0].bank_verified
    ) {
      return res.status(400).json({
        error: "Bank details not verified. Please verify your bank first."
      });
    }

    const bank = bankRes.rows[0];

    /* ===============================
       3️⃣ CREATE WITHDRAWAL (SNAPSHOT BANK)
    =============================== */
    await pool.query(
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

    /* ===============================
       4️⃣ DEDUCT FROM WALLET
    =============================== */
    await pool.query(
      `
      UPDATE wallets
      SET balance = balance - $1,
          updated_at = NOW()
      WHERE user_id = $2
      `,
      [amount, userId]
    );

    res.json({
      success: true,
      message: "Withdrawal requested successfully"
    });

  } catch (err) {
    console.error("WITHDRAWAL REQUEST ERROR:", err);
    res.status(500).json({ error: "Withdrawal failed" });
  }
});

/**
 * ===============================
 * GET /withdrawals/mine
 * Seller withdrawal history
 * ===============================
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
    console.error("LOAD WITHDRAWALS ERROR:", err);
    res.status(500).json({ error: "Failed to load withdrawals" });
  }
});

/**
 * ===============================
 * GET /withdrawals/admin/pending
 * Admin: view pending withdrawals
 * ===============================
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
    console.error("ADMIN LOAD WITHDRAWALS ERROR:", err);
    res.status(500).json({ error: "Failed to load withdrawals" });
  }
});

/**
 * ===============================
 * PATCH /withdrawals/:id/approve
 * Admin approves withdrawal
 * ===============================
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

    if (result.rows.length === 0) {
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
    console.error("APPROVE WITHDRAWAL ERROR:", err);
    res.status(500).json({ error: "Approval failed" });
  }
});

/**
 * ===============================
 * PATCH /withdrawals/:id/reject
 * Admin rejects withdrawal and refunds wallet
 * ===============================
 */
router.patch("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { id } = req.params;

    const withdrawalRes = await pool.query(
      `
      SELECT *
      FROM withdrawals
      WHERE id = $1 AND status = 'pending'
      `,
      [id]
    );

    if (withdrawalRes.rows.length === 0) {
      return res.status(400).json({ error: "Invalid withdrawal" });
    }

    const withdrawal = withdrawalRes.rows[0];

    await pool.query(
      `
      UPDATE withdrawals
      SET status = 'rejected',
          processed_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    await pool.query(
      `
      UPDATE wallets
      SET balance = balance + $1,
          updated_at = NOW()
      WHERE user_id = $2
      `,
      [withdrawal.amount, withdrawal.user_id]
    );

    await auditLog({
      adminId: req.user.id,
      action: "reject_withdrawal",
      entityType: "withdrawal",
      entityId: id
    });

    res.json({ success: true });

  } catch (err) {
    console.error("REJECT WITHDRAWAL ERROR:", err);
    res.status(500).json({ error: "Rejection failed" });
  }
});

module.exports = router;
