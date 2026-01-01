const express = require("express");
const router = express.Router();
const pool = require("../../db");

router.post("/", async (req, res) => {
  const { property_id, brand, model, condition, warranty } = req.body;
  const result = await pool.query(
    `
    INSERT INTO gadget_equipment_details
    (property_id, brand, model, condition, warranty)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [property_id, brand, model, condition, warranty]
  );
  res.status(201).json(result.rows[0]);
});

router.get("/:property_id", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM gadget_equipment_details WHERE property_id = $1",
    [req.params.property_id]
  );
  res.json(result.rows[0]);
});

router.put("/:property_id", async (req, res) => {
  const { brand, model, condition, warranty } = req.body;
  const result = await pool.query(
    `
    UPDATE gadget_equipment_details SET
      brand = COALESCE($1, brand),
      model = COALESCE($2, model),
      condition = COALESCE($3, condition),
      warranty = COALESCE($4, warranty)
    WHERE property_id = $5
    RETURNING *
    `,
    [brand, model, condition, warranty, req.params.property_id]
  );
  res.json(result.rows[0]);
});

router.delete("/:property_id", async (req, res) => {
  await pool.query(
    "DELETE FROM gadget_equipment_details WHERE property_id = $1",
    [req.params.property_id]
  );
  res.json({ message: "Gadget details deleted" });
});

module.exports = router;
