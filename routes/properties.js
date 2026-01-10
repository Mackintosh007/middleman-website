const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const upload = require("../middleware/upload"); // ✅ ADD
const cloudinary = require("../utils/cloudinary"); // ✅ ADD

/**
 * CREATE PROPERTY (ATOMIC WITH IMAGES)
 */
router.post(
  "/",
  auth,
  roles("admin", "agent", "individual_seller"),
  upload.array("images", 5), // ✅ ADD
  async (req, res) => {
    const client = await pool.connect();
    const uploadedImages = [];

    try {
      const {
        property_type,
        title,
        description,
        location,
        price,
        condition
      } = req.body;

      // 🔒 HARD BACKEND RULE
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one image is required" });
      }

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

      if (condition && !["new", "used"].includes(condition)) {
        return res.status(400).json({ error: "Invalid condition" });
      }

      // Track uploaded images for cleanup if DB fails
      req.files.forEach((file) => {
        uploadedImages.push({
          url: file.path,
          public_id: file.filename
        });
      });

      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO properties
         (owner_id, property_type, title, description, location, price, revenue_type, condition)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          req.user.id,
          property_type,
          title,
          description,
          location,
          price,
          revenue_type,
          condition || null
        ]
      );

      const property = result.rows[0];

      // ✅ Save images (assumes images table already exists & is used)
      for (const img of uploadedImages) {
        await client.query(
          `
          INSERT INTO property_images (property_id, image_url)
          VALUES ($1, $2)
          `,
          [property.id, img.url]
        );
      }

      await client.query("COMMIT");

      res.status(201).json(property);

    } catch (err) {
      await client.query("ROLLBACK");

      // 🧹 CLEAN UP CLOUDINARY ON FAILURE
      for (const img of uploadedImages) {
        try {
          await cloudinary.uploader.destroy(img.public_id);
        } catch (cleanupErr) {
          console.error("Cloudinary cleanup failed:", cleanupErr);
        }
      }

      console.error("CREATE PROPERTY ERROR:", err);
      res.status(500).json({ error: err.message });

    } finally {
      client.release();
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
 * GET PROPERTY STATUS
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
    res.status(500).json({ error: "Failed to load status" });
  }
});

/**
 * UPDATE PROPERTY STATUS (ESCROW-SAFE)
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
        "SELECT id, owner_id, status FROM properties WHERE id = $1",
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

      if (property.status === "pending" || property.status === "sold") {
        return res.status(403).json({
          error: "This listing is locked due to an escrow transaction"
        });
      }

      const orderLock = await pool.query(
        `
        SELECT 1
        FROM orders
        WHERE property_id = $1
        AND status IN ('pending', 'paid')
        LIMIT 1
        `,
        [propertyId]
      );

      if (orderLock.rows.length > 0) {
        return res.status(403).json({
          error:
            "This listing has an active escrow order and cannot be reactivated"
        });
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
 * DELETE PROPERTY
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
