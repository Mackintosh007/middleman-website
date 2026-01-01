const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

/**
 * Get images for a property (public)
 */
router.get("/:propertyId", async (req, res) => {
  try {
    const { propertyId } = req.params;

    const result = await pool.query(
      "SELECT id, image_url FROM property_images WHERE property_id = $1",
      [propertyId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Upload image (OWNER ONLY, MAX 5)
 */
router.post(
  "/:propertyId",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      const { propertyId } = req.params;

      // verify ownership
      const ownerCheck = await pool.query(
        "SELECT owner_id FROM properties WHERE id = $1",
        [propertyId]
      );

      if (
        ownerCheck.rows.length === 0 ||
        ownerCheck.rows[0].owner_id !== req.user.id
      ) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // ✅ LIMIT: max 5 images
      const countResult = await pool.query(
        "SELECT COUNT(*) FROM property_images WHERE property_id = $1",
        [propertyId]
      );

      if (Number(countResult.rows[0].count) >= 5) {
        return res
          .status(400)
          .json({ error: "Maximum of 5 images allowed" });
      }

      const imageUrl = req.file.path;

      const result = await pool.query(
        `INSERT INTO property_images (property_id, image_url)
         VALUES ($1, $2)
         RETURNING id, image_url`,
        [propertyId, imageUrl]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Delete an image (OWNER ONLY)
 */
router.delete("/:imageId", auth, async (req, res) => {
  try {
    const { imageId } = req.params;

    const result = await pool.query(
      `
      SELECT pi.id, p.owner_id
      FROM property_images pi
      JOIN properties p ON p.id = pi.property_id
      WHERE pi.id = $1
      `,
      [imageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    const image = result.rows[0];

    if (image.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await pool.query(
      "DELETE FROM property_images WHERE id = $1",
      [imageId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
