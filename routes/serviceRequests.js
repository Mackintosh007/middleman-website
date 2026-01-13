const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../utils/cloudinary");
const roles = require("../middleware/roles"); 


/**
 * REQUEST TO BECOME SERVICE PROVIDER
 * POST /api/service-requests
 */
router.post("/", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { services } = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "At least one service is required" });
    }

    if (services.length > 2) {
      return res.status(400).json({ error: "Maximum of 2 services allowed" });
    }

    // Prevent duplicate pending request
    const existing = await client.query(
      `SELECT id FROM service_requests
       WHERE user_id = $1 AND status = 'pending'`,
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Request already pending" });
    }

    await client.query("BEGIN");

    // Create request
    const requestRes = await client.query(
      `INSERT INTO service_requests (user_id)
       VALUES ($1)
       RETURNING id`,
      [req.user.id]
    );

    const requestId = requestRes.rows[0].id;
    const serviceIds = [];

    // Create services
    for (const s of services) {
      const serviceRes = await client.query(
        `INSERT INTO services
         (service_request_id, user_id, category, description, location, phone, whatsapp)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id`,
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

    // 🔑 IMPORTANT: return service IDs
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
 * ===============================
 * ADMIN: VIEW PENDING SERVICE REQUESTS
 * GET /api/service-requests/admin/pending
 * ===============================
 */
router.get(
  "/admin/pending",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          sr.id,
          sr.user_id,
          sr.status,
          sr.created_at,
          u.email,
          u.first_name,
          u.last_name
        FROM service_requests sr
        JOIN users u ON u.id = sr.user_id
        WHERE sr.status = 'pending'
        ORDER BY sr.created_at DESC
      `);

      res.json(result.rows);
    } catch (err) {
      console.error("LOAD SERVICE REQUESTS ERROR:", err);
      res.status(500).json({ error: "Failed to load service requests" });
    }
  }
);


module.exports = router;
