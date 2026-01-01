const express = require("express");
const router = express.Router();
const pool = require("../../db");

router.post("/", async (req, res) => {
  const { property_id, brand, model, year, mileage } = req.body;
  const result = await pool.query(
    `
    INSERT INTO car_details (property_id, brand, model, year, mileage)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [property_id, brand, model, year, mileage]
  );
  res.status(201).json(result.rows[0]);
});

router.get("/:property_id", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM car_details WHERE property_id = $1",
    [req.params.property_id]
  );
  res.json(result.rows[0]);
});

router.put("/:property_id", async (req, res) => {
  const { brand, model, year, mileage } = req.body;
  const result = await pool.query(
    `
    UPDATE car_details SET
      brand = COALESCE($1, brand),
      model = COALESCE($2, model),
      year = COALESCE($3, year),
      mileage = COALESCE($4, mileage)
    WHERE property_id = $5
    RETURNING *
    `,
    [brand, model, year, mileage, req.params.property_id]
  );
  res.json(result.rows[0]);
});

router.delete("/:property_id", async (req, res) => {
  await pool.query(
    "DELETE FROM car_details WHERE property_id = $1",
    [req.params.property_id]
  );
  res.json({ message: "Car details deleted" });
});

module.exports = router;
