const express = require("express");
const router = express.Router();
const pool = require("../../db");

router.post("/", async (req, res) => {
  const { property_id, bedrooms, apartment_type } = req.body;
  const result = await pool.query(
    `
    INSERT INTO apartment_details (property_id, bedrooms, apartment_type)
    VALUES ($1,$2,$3)
    RETURNING *
    `,
    [property_id, bedrooms, apartment_type]
  );
  res.status(201).json(result.rows[0]);
});

router.get("/:property_id", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM apartment_details WHERE property_id = $1",
    [req.params.property_id]
  );
  res.json(result.rows[0]);
});

router.put("/:property_id", async (req, res) => {
  const { bedrooms, apartment_type } = req.body;
  const result = await pool.query(
    `
    UPDATE apartment_details SET
      bedrooms = COALESCE($1, bedrooms),
      apartment_type = COALESCE($2, apartment_type)
    WHERE property_id = $3
    RETURNING *
    `,
    [bedrooms, apartment_type, req.params.property_id]
  );
  res.json(result.rows[0]);
});

router.delete("/:property_id", async (req, res) => {
  await pool.query(
    "DELETE FROM apartment_details WHERE property_id = $1",
    [req.params.property_id]
  );
  res.json({ message: "Apartment details deleted" });
});

module.exports = router;
