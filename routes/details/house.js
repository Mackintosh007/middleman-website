const express = require("express");
const router = express.Router();
const pool = require("../../db");

/**
 * CREATE HOUSE DETAILS
 * POST /api/details/house
 */
router.post("/", async (req, res) => {
  try {
    const { property_id, bedrooms, house_type } = req.body;

    const house = await pool.query(
      `
      INSERT INTO house_details (property_id, bedrooms, house_type)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [property_id, bedrooms, house_type]
    );

    res.status(201).json(house.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET HOUSE DETAILS BY PROPERTY
 * GET /api/details/house/:property_id
 */
router.get("/:property_id", async (req, res) => {
  try {
    const { property_id } = req.params;

    const house = await pool.query(
      "SELECT * FROM house_details WHERE property_id = $1",
      [property_id]
    );

    if (house.rows.length === 0) {
      return res.status(404).json({ message: "House details not found" });
    }

    res.json(house.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE HOUSE DETAILS
 * PUT /api/details/house/:property_id
 */
router.put("/:property_id", async (req, res) => {
  try {
    const { property_id } = req.params;
    const { bedrooms, house_type } = req.body;

    const updated = await pool.query(
      `
      UPDATE house_details
      SET
        bedrooms = COALESCE($1, bedrooms),
        house_type = COALESCE($2, house_type)
      WHERE property_id = $3
      RETURNING *
      `,
      [bedrooms, house_type, property_id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "House details not found" });
    }

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE HOUSE DETAILS
 * DELETE /api/details/house/:property_id
 */
router.delete("/:property_id", async (req, res) => {
  try {
    const { property_id } = req.params;

    await pool.query(
      "DELETE FROM house_details WHERE property_id = $1",
      [property_id]
    );

    res.json({ message: "House details deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
