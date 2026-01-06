const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const auditLog = require("../utils/auditLog");

/**
 * USER: Request to become seller or agent
 */
router.post("/", auth, async (req, res) => {
  try {
    const { requested_role } = req.body;

    if (!["individual_seller", "agent"].includes(requested_role)) {
      return res.status(400).json({ error: "Invalid role request" });
    }

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
    console.error("SELLER REQUEST CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN: View pending requests
 */
router.get("/", auth, roles("admin"), async (req, res) => {
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
    console.error("SELLER REQUEST LOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ===============================
 * ADMIN: APPROVE REQUEST ✅ FIXED
 * ===============================
 */
router.patch(
  "/:id/approve",
  auth,
  roles("admin"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const requestId = req.params.id;

      await client.query("BEGIN");

      const reqRes = await client.query(
        `SELECT * FROM seller_requests
         WHERE id = $1 AND status = 'pending'
         FOR UPDATE`,
        [requestId]
      );

      if (!reqRes.rows.length) {
        throw new Error("Request not found or already processed");
      }

      const request = reqRes.rows[0];

      await client.query(
        `UPDATE seller_requests
         SET status = 'approved'
         WHERE id = $1`,
        [requestId]
      );

      await client.query(
        `UPDATE users
         SET role = $1
         WHERE id = $2`,
        [request.requested_role, request.user_id]
      );

      // create agent record if needed
      if (request.requested_role === "agent") {
        await client.query(
          `INSERT INTO agents (user_id, verified)
           VALUES ($1, true)
           ON CONFLICT (user_id) DO NOTHING`,
          [request.user_id]
        );
      }
      
      await auditLog({
        adminId: req.user.id,
        action: "approve_seller_request",
        entityType: "seller_request",
        entityId: requestId,
        metadata: {
          role: request.requested_role
        }
      });


      await client.query("COMMIT");

      res.json({ success: true });

    } catch (err) {
      await client.query("ROLLBACK");
      console.error("SELLER REQUEST APPROVE ERROR:", err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

/**
 * ===============================
 * ADMIN: REJECT REQUEST ✅ FIXED
 * ===============================
 */
router.patch(
  "/:id/reject",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE seller_requests
         SET status = 'rejected'
         WHERE id = $1 AND status = 'pending'
         RETURNING id`,
        [req.params.id]
      );

      if (!result.rows.length) {
        return res.status(400).json({ error: "Invalid request" });
      }

      res.json({ success: true });

    } catch (err) {
      console.error("SELLER REQUEST REJECT ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
