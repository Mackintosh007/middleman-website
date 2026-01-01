const express = require("express");
const router = express.Router();
const pool = require("../../db");

/**
 * CREATE LAND DETAILS
 * POST /api/details/land
 */
router.post("/", async (req, res) => {
  try {
    const { property_id, size } = req.body;

    const land = await pool.query(
      `
      INSERT INTO land_details (property_id, size)
      VALUES ($1, $2)
      RETURNING *
      `,
      [property_id, size]
    );

    res.status(201).json(land.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET LAND DETAILS BY PROPERTY
 * GET /api/details/land/:property_id
 */
router.get("/:property_id", async (req, res) => {
  try {
    const { property_id } = req.params;

    const land = await pool.query(
      "SELECT * FROM land_details WHERE property_id = $1",
      [property_id]
    );

    if (land.rows.length === 0) {
      return res.status(404).json({ message: "Land details not found" });
    }

    res.json(land.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE LAND DETAILS
 * PUT /api/details/land/:property_id
 */
router.put("/:property_id", async (req, res) => {
  try {
    const { property_id } = req.params;
    const { size } = req.body;

    const updated = await pool.query(
      `
      UPDATE land_details
      SET size = COALESCE($1, size)
      WHERE property_id = $2
      RETURNING *
      `,
      [size, property_id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "Land details not found" });
    }

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE LAND DETAILS
 * DELETE /api/details/land/:property_id
 */
router.delete("/:property_id", async (req, res) => {
  try {
    const { property_id } = req.params;

    await pool.query(
      "DELETE FROM land_details WHERE property_id = $1",
      [property_id]
    );

    res.json({ message: "Land details deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
