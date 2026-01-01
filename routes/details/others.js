const express = require("express");
const router = express.Router();
const pool = require("../../db");

/**
 * CREATE OTHERS DETAILS
 * POST /api/details/others
 */
router.post("/", async (req, res) => {
  try {
    const { property_id, details } = req.body;

    const result = await pool.query(
      `
      INSERT INTO others_details (property_id, details)
      VALUES ($1, $2)
      RETURNING *
      `,
      [property_id, details]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET OTHERS DETAILS BY PROPERTY
 * GET /api/details/others/:property_id
 */
router.get("/:property_id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM others_details WHERE property_id = $1",
      [req.params.property_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Other details not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE OTHERS DETAILS
 * PUT /api/details/others/:property_id
 */
router.put("/:property_id", async (req, res) => {
  try {
    const { details } = req.body;

    const result = await pool.query(
      `
      UPDATE others_details
      SET details = COALESCE($1, details)
      WHERE property_id = $2
      RETURNING *
      `,
      [details, req.params.property_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Other details not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE OTHERS DETAILS
 * DELETE /api/details/others/:property_id
 */
router.delete("/:property_id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM others_details WHERE property_id = $1",
      [req.params.property_id]
    );

    res.json({ message: "Other details deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
