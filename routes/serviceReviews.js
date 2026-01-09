const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

/**
 * ===============================
 * CREATE SERVICE REVIEW
 * ===============================
 * POST /api/service-reviews
 */
router.post("/", auth, async (req, res) => {
  try {
    const { service_id, rating, comment } = req.body;

    if (!service_id || !rating) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Load service
    const serviceRes = await pool.query(
      "SELECT user_id FROM services WHERE id = $1 AND status = 'active'",
      [service_id]
    );

    if (!serviceRes.rows.length) {
      return res.status(404).json({ error: "Service not found" });
    }

    const service = serviceRes.rows[0];

    // ❌ Cannot review your own service
    if (service.user_id === req.user.id) {
      return res
        .status(403)
        .json({ error: "You cannot review your own service" });
    }

    // Prevent duplicate reviews
    const existing = await pool.query(
      `SELECT id FROM service_reviews
       WHERE service_id = $1 AND reviewer_id = $2`,
      [service_id, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "You already reviewed this service" });
    }

    const result = await pool.query(
      `
      INSERT INTO service_reviews
      (service_id, reviewer_id, rating, comment)
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [service_id, req.user.id, rating, comment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("SERVICE REVIEW ERROR:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

/**
 * ===============================
 * GET SERVICE RATING STATS
 * ===============================
 * GET /api/service-reviews/:serviceId
 */
router.get("/:serviceId", async (req, res) => {
  try {
    const { serviceId } = req.params;

    const statsRes = await pool.query(
      `
      SELECT
        COUNT(*) AS total_reviews,
        ROUND(AVG(rating), 1) AS average_rating
      FROM service_reviews
      WHERE service_id = $1
      `,
      [serviceId]
    );

    res.json(statsRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to load ratings" });
  }
});

module.exports = router;
