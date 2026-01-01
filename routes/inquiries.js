const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

/**
 * Express interest in a property
 */
router.post("/", auth, async (req, res) => {
  try {
    const { property_id, message } = req.body;

    const result = await pool.query(
      `INSERT INTO property_inquiries (property_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [property_id, req.user.id, message]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
