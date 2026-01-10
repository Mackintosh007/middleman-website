const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const uploadServiceImages = require("../middleware/serviceUpload");
const cloudinary = require("../utils/cloudinary");

/**
 * ======================================================
 * 🔐 UPLOAD SERVICE IMAGES (MAX 5, MIN 1)
 * POST /api/service-images/:serviceId
 * ======================================================
 */
router.post(
  "/:serviceId",
  auth,
  uploadServiceImages.array("images", 5),
  async (req, res) => {
    try {
      const { serviceId } = req.params;

      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one image is required" });
      }

      // 1️⃣ Ownership check
      const serviceRes = await pool.query(
        `SELECT user_id FROM services WHERE id = $1`,
        [serviceId]
      );

      if (!serviceRes.rows.length) {
        return res.status(404).json({ error: "Service not found" });
      }

      if (Number(serviceRes.rows[0].user_id) !== Number(req.user.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 2️⃣ Enforce max 5 total images
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM service_images WHERE service_id = $1`,
        [serviceId]
      );

      const existingCount = Number(countRes.rows[0].count);

      if (existingCount + req.files.length > 5) {
        return res.status(400).json({
          error: "Maximum of 5 images allowed per service",
        });
      }

      // 3️⃣ Save images
      for (const file of req.files) {
        await pool.query(
          `
          INSERT INTO service_images (service_id, image_url)
          VALUES ($1, $2)
          `,
          [serviceId, file.path]
        );
      }

      res.json({ success: true });

    } catch (err) {
      console.error("SERVICE IMAGE UPLOAD ERROR:", err);
      res.status(500).json({ error: "Image upload failed" });
    }
  }
);

/**
 * ======================================================
 * 🔐 DELETE SERVICE IMAGE (MIN 1 MUST REMAIN)
 * DELETE /api/service-images/:imageId
 * ======================================================
 */
router.delete("/:imageId", auth, async (req, res) => {
  try {
    const { imageId } = req.params;

    // 1️⃣ Load image + ownership
    const imageRes = await pool.query(
      `
      SELECT 
        si.id,
        si.image_url,
        si.service_id,
        s.user_id
      FROM service_images si
      JOIN services s ON s.id = si.service_id
      WHERE si.id = $1
      `,
      [imageId]
    );

    if (!imageRes.rows.length) {
      return res.status(404).json({ error: "Image not found" });
    }

    const image = imageRes.rows[0];

    if (Number(image.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 2️⃣ Prevent deleting last image
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM service_images WHERE service_id = $1`,
      [image.service_id]
    );

    if (Number(countRes.rows[0].count) <= 1) {
      return res.status(400).json({
        error: "Service must have at least one image",
      });
    }

    // 3️⃣ Delete from Cloudinary
    const publicId = image.image_url
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0];

    await cloudinary.uploader.destroy(publicId);

    // 4️⃣ Delete from DB
    await pool.query(
      `DELETE FROM service_images WHERE id = $1`,
      [imageId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE SERVICE IMAGE ERROR:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

/**
 * ======================================================
 * 🌍 GET SERVICE IMAGES (PUBLIC)
 * GET /api/service-images/:serviceId
 * ======================================================
 */
router.get("/:serviceId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM service_images WHERE service_id = $1`,
      [req.params.serviceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("LOAD SERVICE IMAGES ERROR:", err);
    res.status(500).json([]);
  }
});

module.exports = router;
