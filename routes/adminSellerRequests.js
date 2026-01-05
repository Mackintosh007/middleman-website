const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * ===============================
 * ADMIN: GET PENDING SELLER REQUESTS
 * GET /api/admin/seller-requests
 * ===============================
 */
router.get(
  "/seller-requests",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT sr.*, u.email, u.first_name, u.last_name
        FROM seller_requests sr
        JOIN users u ON u.id = sr.user_id
        WHERE sr.status = 'pending'
        ORDER BY sr.created_at DESC
        `
      );

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * ===============================
 * ADMIN: APPROVE SELLER REQUEST
 * PATCH /api/admin/seller-requests/:id/approve
 * ===============================
 */
router.patch(
  "/seller-requests/:id/approve",
  auth,
  roles("admin"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const srRes = await client.query(
        "SELECT * FROM seller_requests WHERE id = $1 FOR UPDATE",
        [req.params.id]
      );

      if (!srRes.rows.length) {
        return res.status(404).json({ error: "Request not found" });
      }

      const request = srRes.rows[0];

      await client.query(
        "UPDATE seller_requests SET status = 'approved' WHERE id = $1",
        [req.params.id]
      );

      await client.query(
        "UPDATE users SET role = $1 WHERE id = $2",
        [request.requested_role, request.user_id]
      );

      // Auto-create agent row if needed
      if (request.requested_role === "agent") {
        await client.query(
          `
          INSERT INTO agents (user_id, verified)
          VALUES ($1, true)
          ON CONFLICT (user_id) DO NOTHING
          `,
          [request.user_id]
        );
      }

      await client.query("COMMIT");

      res.json({ success: true });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

/**
 * ===============================
 * ADMIN: REJECT SELLER REQUEST
 * PATCH /api/admin/seller-requests/:id/reject
 * ===============================
 */
router.patch(
  "/seller-requests/:id/reject",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      await pool.query(
        "UPDATE seller_requests SET status = 'rejected' WHERE id = $1",
        [req.params.id]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
