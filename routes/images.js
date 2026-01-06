const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

/**
 * ===============================
 * GET IMAGES FOR A PROPERTY (PUBLIC)
 * ===============================
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
    console.error("LOAD IMAGES ERROR:", err);
    res.status(500).json({ error: "Failed to load images" });
  }
});

/**
 * ===============================
 * UPLOAD PROPERTY IMAGES (OWNER ONLY)
 * Supports MULTIPLE images
 * Max 5 images per property
 * ===============================
 */
router.post(
  "/upload/:propertyId",
  auth,
  upload.array("images", 5), // 🔥 MUST MATCH FRONTEND FIELD NAME
  async (req, res) => {
    try {
      const { propertyId } = req.params;

      // 🧪 DEBUG (safe to remove later)
      console.log("FILES:", req.files);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      // 1️⃣ Verify ownership
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

      // 2️⃣ Enforce max 5 images TOTAL
      const countRes = await pool.query(
        "SELECT COUNT(*) FROM property_images WHERE property_id = $1",
        [propertyId]
      );

      const existingCount = Number(countRes.rows[0].count);
      const incomingCount = req.files.length;

      if (existingCount + incomingCount > 5) {
        return res.status(400).json({
          error: "Maximum of 5 images allowed per listing",
        });
      }

      // 3️⃣ Save images
      const savedImages = [];

      for (const file of req.files) {
        const result = await pool.query(
          `INSERT INTO property_images (property_id, image_url)
           VALUES ($1, $2)
           RETURNING id, image_url`,
          [propertyId, file.path]
        );

        savedImages.push(result.rows[0]);
      }

      res.status(201).json({
        success: true,
        images: savedImages,
      });

    } catch (err) {
      console.error("IMAGE UPLOAD ERROR:", err);
      res.status(500).json({ error: "Image upload failed" });
    }
  }
);

/**
 * ===============================
 * DELETE IMAGE (OWNER ONLY)
 * ===============================
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

    if (!result.rows.length) {
      return res.status(404).json({ error: "Image not found" });
    }

    if (result.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await pool.query(
      "DELETE FROM property_images WHERE id = $1",
      [imageId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE IMAGE ERROR:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

module.exports = router;
