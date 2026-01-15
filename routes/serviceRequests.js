const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * ==================================================
 * USER: REQUEST TO BECOME SERVICE PROVIDER
 * POST /api/service-requests
 * - User can submit up to 2 services
 * - Creates ONE service_request + MULTIPLE services
 * ==================================================
 */
router.post("/", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { services } = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one service is required" });
    }

    if (services.length > 2) {
      return res
        .status(400)
        .json({ error: "Maximum of 2 services allowed" });
    }

    // Prevent duplicate pending request
    const existing = await client.query(
      `
      SELECT id
      FROM service_requests
      WHERE user_id = $1 AND status = 'submitted'
      `,
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "You already have a pending request" });
    }

    await client.query("BEGIN");

    // Create service request (TRACKING ONLY)
    const requestRes = await client.query(
      `
      INSERT INTO service_requests (user_id, status)
      VALUES ($1, 'submitted')
      RETURNING id
      `,
      [req.user.id]
    );

    const requestId = requestRes.rows[0].id;
    const serviceIds = [];

    // Create individual services (EACH will be approved/rejected)
    for (const s of services) {
      const serviceRes = await client.query(
        `
        INSERT INTO services
          (service_request_id, user_id, category, description, location, phone, whatsapp, status)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING id
        `,
        [
          requestId,
          req.user.id,
          s.category,
          s.description,
          s.location,
          s.phone,
          s.whatsapp,
        ]
      );

      serviceIds.push(serviceRes.rows[0].id);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      serviceIds,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("SERVICE REQUEST ERROR:", err);
    res.status(500).json({ error: "Failed to submit service request" });
  } finally {
    client.release();
  }
});

/**
 * ==================================================
 * ADMIN: VIEW PENDING SERVICES (INDIVIDUAL)
 * GET /api/service-requests/admin/pending
 * ==================================================
 */
router.get(
  "/admin/pending",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          s.id,
          s.category,
          s.description,
          s.location,
          s.phone,
          s.whatsapp,
          s.status,
          s.created_at,
          u.id AS user_id,
          u.email,
          u.first_name,
          u.last_name
        FROM services s
        JOIN users u ON u.id = s.user_id
        WHERE s.status = 'pending'
        ORDER BY s.created_at DESC
        `
      );

      res.json(result.rows);
    } catch (err) {
      console.error("LOAD PENDING SERVICES ERROR:", err);
      res
        .status(500)
        .json({ error: "Failed to load pending services" });
    }
  }
);

/**
 * ==================================================
 * ADMIN: APPROVE SINGLE SERVICE
 * PATCH /api/service-requests/services/:id/approve
 * ==================================================
 */
router.patch(
  "/services/:id/approve",
  auth,
  roles("admin"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const serviceId = req.params.id;

      await client.query("BEGIN");

      const serviceRes = await client.query(
        `
        SELECT id, service_request_id
        FROM services
        WHERE id = $1 AND status = 'pending'
        FOR UPDATE
        `,
        [serviceId]
      );

      if (!serviceRes.rows.length) {
        return res
          .status(400)
          .json({ error: "Service not found or already processed" });
      }

      const { service_request_id } = serviceRes.rows[0];

      await client.query(
        `
        UPDATE services
        SET status = 'approved'
        WHERE id = $1
        `,
        [serviceId]
      );

      // If no pending services remain, mark request completed
      const pendingCheck = await client.query(
        `
        SELECT 1
        FROM services
        WHERE service_request_id = $1
          AND status = 'pending'
        LIMIT 1
        `,
        [service_request_id]
      );

      if (pendingCheck.rows.length === 0) {
        await client.query(
          `
          UPDATE service_requests
          SET status = 'completed'
          WHERE id = $1
          `,
          [service_request_id]
        );
      }

      await client.query("COMMIT");

      res.json({ success: true });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("APPROVE SERVICE ERROR:", err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

/**
 * ==================================================
 * ADMIN: REJECT SINGLE SERVICE
 * PATCH /api/service-requests/services/:id/reject
 * ==================================================
 */
router.patch(
  "/services/:id/reject",
  auth,
  roles("admin"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const serviceId = req.params.id;

      await client.query("BEGIN");

      const serviceRes = await client.query(
        `
        SELECT id, service_request_id
        FROM services
        WHERE id = $1 AND status = 'pending'
        FOR UPDATE
        `,
        [serviceId]
      );

      if (!serviceRes.rows.length) {
        return res
          .status(400)
          .json({ error: "Service not found or already processed" });
      }

      const { service_request_id } = serviceRes.rows[0];

      await client.query(
        `
        UPDATE services
        SET status = 'rejected'
        WHERE id = $1
        `,
        [serviceId]
      );

      // If no pending services remain, mark request completed
      const pendingCheck = await client.query(
        `
        SELECT 1
        FROM services
        WHERE service_request_id = $1
          AND status = 'pending'
        LIMIT 1
        `,
        [service_request_id]
      );

      if (pendingCheck.rows.length === 0) {
        await client.query(
          `
          UPDATE service_requests
          SET status = 'completed'
          WHERE id = $1
          `,
          [service_request_id]
        );
      }

      await client.query("COMMIT");

      res.json({ success: true });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("REJECT SERVICE ERROR:", err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
