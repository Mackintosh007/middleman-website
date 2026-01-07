const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * CREATE PROPERTY
 */
router.post(
  "/",
  auth,
  roles("admin", "agent", "individual_seller"),
  async (req, res) => {
    try {
      const {
        property_type,
        title,
        description,
        location,
        price
      } = req.body;

      let revenue_type = "commission";

      if (
        [
          "gadget",
          "equipment",
          "fashion",
          "furniture",
          "building_materials"
        ].includes(property_type)
      ) {
        revenue_type = "escrow";
      }

      const result = await pool.query(
        `INSERT INTO properties
         (owner_id, property_type, title, description, location, price, revenue_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [
          req.user.id,
          property_type,
          title,
          description,
          location,
          price,
          revenue_type
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET ALL PROPERTIES (PUBLIC)
 */
router.get("/", async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await pool.query(
      `SELECT *
       FROM properties
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ results: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET LOGGED-IN SELLER'S PROPERTIES
 */
router.get("/mine", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM properties
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ results: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET SINGLE PROPERTY
 */
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM properties WHERE id = $1",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ===============================
 * GET PROPERTY STATUS (PUBLIC, SAFE)
 * ===============================
 * GET /properties/:id/status
 */
router.get("/:id/status", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT status FROM properties WHERE id = $1",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json({ status: result.rows[0].status });
  } catch (err) {
    console.error("STATUS LOAD ERROR:", err);
    res.status(500).json({ error: "Failed to load status" });
  }
});

/**
 * ===============================
 * ADMIN / SELLER: UPDATE PROPERTY STATUS
 * ===============================
 * PATCH /properties/:id/status
 */
router.patch(
  "/:id/status",
  auth,
  roles("admin", "agent", "individual_seller"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const propertyId = req.params.id;

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const propRes = await pool.query(
        "SELECT owner_id FROM properties WHERE id = $1",
        [propertyId]
      );

      if (!propRes.rows.length) {
        return res.status(404).json({ error: "Property not found" });
      }

      const property = propRes.rows[0];

      if (
        req.user.role !== "admin" &&
        Number(property.owner_id) !== Number(req.user.id)
      ) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const result = await pool.query(
        `UPDATE properties
         SET status = $1
         WHERE id = $2
         RETURNING id, status`,
        [status, propertyId]
      );

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * ===============================
 * DELETE PROPERTY (OWNER / ADMIN)
 * ===============================
 * DELETE /properties/:id
 */
router.delete(
  "/:id",
  auth,
  roles("admin", "agent", "individual_seller"),
  async (req, res) => {
    try {
      const propertyId = req.params.id;

      const propRes = await pool.query(
        "SELECT owner_id FROM properties WHERE id = $1",
        [propertyId]
      );

      if (!propRes.rows.length) {
        return res.status(404).json({ error: "Property not found" });
      }

      const property = propRes.rows[0];

      if (
        req.user.role !== "admin" &&
        Number(property.owner_id) !== Number(req.user.id)
      ) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await pool.query(
        "DELETE FROM properties WHERE id = $1",
        [propertyId]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
