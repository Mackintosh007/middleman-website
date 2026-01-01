const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * USER: Request to become seller or agent
 * POST /api/seller-requests
 */
router.post("/", auth, async (req, res) => {
  try {
    const { requested_role } = req.body;

    if (!["individual_seller", "agent"].includes(requested_role)) {
      return res.status(400).json({ error: "Invalid role request" });
    }

    // prevent duplicate pending requests
    const existing = await pool.query(
      `SELECT id FROM seller_requests
       WHERE user_id = $1 AND status = 'pending'`,
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Request already pending" });
    }

    const result = await pool.query(
      `INSERT INTO seller_requests (user_id, requested_role)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, requested_role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN: View all pending seller requests
 * GET /api/seller-requests
 */
router.get(
  "/",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT sr.*, u.email, u.first_name, u.last_name
         FROM seller_requests sr
         JOIN users u ON u.id = sr.user_id
         WHERE sr.status = 'pending'
         ORDER BY sr.created_at DESC`
      );

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * ADMIN: Approve or reject request
 * PATCH /api/seller-requests/:id
 */
router.patch(
  "/:id",
  auth,
  roles("admin"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { status } = req.body;
      const requestId = req.params.id;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await client.query("BEGIN");

      const requestResult = await client.query(
        `SELECT * FROM seller_requests WHERE id = $1 FOR UPDATE`,
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error("Request not found");
      }

      const request = requestResult.rows[0];

      // update request status
      await client.query(
        `UPDATE seller_requests SET status = $1 WHERE id = $2`,
        [status, requestId]
      );

      if (status === "approved") {
        // update user role
        await client.query(
          `UPDATE users SET role = $1 WHERE id = $2`,
          [request.requested_role, request.user_id]
        );

        // if agent → create agents row
        if (request.requested_role === "agent") {
          await client.query(
            `INSERT INTO agents (user_id, verified)
             VALUES ($1, true)
             ON CONFLICT (user_id) DO NOTHING`,
            [request.user_id]
          );
        }
      }

      await client.query("COMMIT");
      res.json({ message: `Request ${status}` });

    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
