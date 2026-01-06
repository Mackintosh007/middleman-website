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
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // 1️⃣ Load wallet
    const walletRes = await pool.query(
      "SELECT * FROM wallets WHERE user_id = $1",
      [userId]
    );

    if (walletRes.rows.length === 0) {
      return res.status(400).json({ error: "Wallet not found" });
    }

    const wallet = walletRes.rows[0];

    if (Number(wallet.balance) < Number(amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // 2️⃣ Create withdrawal request
    await pool.query(
      `INSERT INTO withdrawals (user_id, amount)
       VALUES ($1, $2)`,
      [userId, amount]
    );

    // 3️⃣ Deduct from wallet balance
    await pool.query(
      `UPDATE wallets
       SET balance = balance - $1
       WHERE user_id = $2`,
      [amount, userId]
    );

    await auditLog({
      adminId: req.user.id,
      action: "approve_withdrawal",
      entityType: "withdrawal",
      entityId: id
    });


    res.json({ success: true, message: "Withdrawal requested" });

  } catch (err) {
    console.error("Withdrawal request error:", err);
    res.status(500).json({ error: "Withdrawal failed" });
  }
});

/**
 * GET /withdrawals/mine
 * Seller withdrawal history
 */
router.get("/mine", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM withdrawals
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load withdrawals" });
  }
});
/**
 * GET /withdrawals/admin/pending
 * Admin: view pending withdrawals
 */
router.get("/admin/pending", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(
      `SELECT w.*, u.email
       FROM withdrawals w
       JOIN users u ON u.id = w.user_id
       WHERE w.status = 'pending'
       ORDER BY w.created_at ASC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load withdrawals" });
  }
});

/**
 * PATCH /withdrawals/:id/approve
 * Admin approves withdrawal
 */
router.patch("/:id/approve", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { id } = req.params;

    const result = await pool.query(
      `UPDATE withdrawals
       SET status = 'approved'
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid withdrawal" });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Approval failed" });
  }
});

/**
 * PATCH /withdrawals/:id/reject
 * Admin rejects withdrawal and refunds wallet
 */
router.patch("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { id } = req.params;

    // 1️⃣ Load withdrawal
    const withdrawalRes = await pool.query(
      `SELECT * FROM withdrawals
       WHERE id = $1 AND status = 'pending'`,
      [id]
    );

    if (withdrawalRes.rows.length === 0) {
      return res.status(400).json({ error: "Invalid withdrawal" });
    }

    const withdrawal = withdrawalRes.rows[0];

    // 2️⃣ Mark rejected
    await pool.query(
      `UPDATE withdrawals
       SET status = 'rejected'
       WHERE id = $1`,
      [id]
    );

    // 3️⃣ Refund wallet
    await pool.query(
      `UPDATE wallets
       SET balance = balance + $1
       WHERE user_id = $2`,
      [withdrawal.amount, withdrawal.user_id]
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Rejection failed" });
  }
});


module.exports = router;
