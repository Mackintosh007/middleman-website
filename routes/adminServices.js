const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const auditLog = require("../utils/auditLog");

/**
 * ===============================
 * ADMIN: VIEW PENDING SERVICE REQUESTS
 * ===============================
 * GET /api/admin/services/requests
 */
router.get(
  "/requests",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT sr.*, u.email
        FROM service_requests sr
        JOIN users u ON u.id = sr.user_id
        WHERE sr.status = 'pending'
        ORDER BY sr.created_at ASC
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
 * ADMIN: APPROVE SERVICE REQUEST
 * ===============================
 * PATCH /api/admin/services/:id/approve
 */
router.patch(
  "/:id/approve",
  auth,
  roles("admin"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const reqRes = await client.query(
        `
        SELECT * FROM service_requests
        WHERE id = $1 AND status = 'pending'
        FOR UPDATE
        `,
        [req.params.id]
      );

      if (!reqRes.rows.length) {
        throw new Error("Service request not found or already processed");
      }

      // 1️⃣ Approve request
      await client.query(
        `
        UPDATE service_requests
        SET status = 'approved'
        WHERE id = $1
        `,
        [req.params.id]
      );

      // 2️⃣ Activate all related services
      await client.query(
        `
        UPDATE services
        SET status = 'active'
        WHERE service_request_id = $1
        `,
        [req.params.id]
      );

      // 3️⃣ Audit log
      await auditLog({
        adminId: req.user.id,
        action: "approve_service_request",
        entityType: "service_request",
        entityId: req.params.id
      });

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
 * ADMIN: REJECT SERVICE REQUEST
 * ===============================
 * PATCH /api/admin/services/:id/reject
 */
router.patch(
  "/:id/reject",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        UPDATE service_requests
        SET status = 'rejected'
        WHERE id = $1 AND status = 'pending'
        RETURNING id
        `,
        [req.params.id]
      );

      if (!result.rows.length) {
        return res
          .status(400)
          .json({ error: "Invalid service request" });
      }

      await auditLog({
        adminId: req.user.id,
        action: "reject_service_request",
        entityType: "service_request",
        entityId: req.params.id
      });

      res.json({ success: true });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
