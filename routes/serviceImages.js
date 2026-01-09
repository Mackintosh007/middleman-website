const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const uploadServiceImages = require("../middleware/serviceUpload");

/**
 * UPLOAD SERVICE IMAGES (MANDATORY)
 * POST /api/service-images/:serviceId
 */
router.post(
  "/:serviceId",
  auth,
  uploadServiceImages.array("images", 5),
  async (req, res) => {
    try {
      const { serviceId } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "At least one image is required" });
      }

      // Ownership check
      const serviceRes = await pool.query(
        `SELECT user_id FROM services WHERE id = $1`,
        [serviceId]
      );

      if (!serviceRes.rows.length) {
        return res.status(404).json({ error: "Service not found" });
      }

      if (serviceRes.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      for (const file of req.files) {
        await pool.query(
          `INSERT INTO service_images (service_id, image_url)
           VALUES ($1,$2)`,
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
 * GET SERVICE IMAGES (PUBLIC)
 * GET /api/service-images/:serviceId
 */
router.get("/:serviceId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM service_images WHERE service_id = $1`,
      [req.params.serviceId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json([]);
  }
});

module.exports = router;
