const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const uploadServiceImages = require("../middleware/serviceUpload");
const cloudinary = require("../utils/cloudinary");

/**
 * ======================================================
 * REQUEST SERVICE PROVIDER
 * POST /api/services/request
 * - User can submit 1 or 2 services
 * - Each service MUST have at least 1 image
 * - Max 5 images per service
 * - Transaction-safe
 * ======================================================
 */
router.post(
  "/request",
  auth,
  uploadServiceImages.any(),
  async (req, res) => {
    const client = await pool.connect();
    const uploadedImages = [];

    try {
      const { services } = req.body;
      const parsedServices = JSON.parse(services);

      if (!Array.isArray(parsedServices) || parsedServices.length === 0) {
        return res.status(400).json({ error: "No services provided" });
      }

      if (parsedServices.length > 2) {
        return res.status(400).json({ error: "Maximum of 2 services allowed" });
      }

      // ✅ enforce max 5 images per service slot
      for (let i = 1; i <= parsedServices.length; i++) {
        const imgs = req.files.filter(
          f => f.fieldname === `service_${i}_images`
        );
        if (imgs.length > 5) {
          return res.status(400).json({
            error: "Maximum of 5 images allowed per service"
          });
        }
      }
            // ✅ enforce max 5 images per service slot
      for (let i = 1; i <= parsedServices.length; i++) {
        const imgs = req.files.filter(
          f => f.fieldname === `service_${i}_images`
        );
        if (imgs.length > 5) {
          return res.status(400).json({
            error: "Maximum of 5 images allowed per service"
          });
        }
      }

      // 🔒 CHECK SERVICE SLOT USAGE (IGNORE REJECTED)
      const usageRes = await pool.query(
        `
        SELECT COUNT(*)::int AS used
        FROM services
        WHERE user_id = $1
          AND status IN ('pending', 'active')
        `,
        [req.user.id]
      );

      if (usageRes.rows[0].used + parsedServices.length > 2) {
        return res.status(400).json({
          error: "You have used your maximum service slots"
        });
      }
      
      const pendingReq = await pool.query(
        `
        SELECT 1
        FROM service_requests
        WHERE user_id = $1 AND status = 'pending'
        LIMIT 1
        `,
        [req.user.id]
      );

      if (pendingReq.rows.length > 0) {
        return res.status(400).json({
          error: "You already have a pending service request"
        });
      }

      await client.query("BEGIN");

      // 1️⃣ Create service request
      const reqRes = await client.query(
        `INSERT INTO service_requests (user_id)
         VALUES ($1)
         RETURNING id`,
        [req.user.id]
      );

      const serviceRequestId = reqRes.rows[0].id;

      // 2️⃣ Create services + images
      for (let i = 0; i < parsedServices.length; i++) {
        const svc = parsedServices[i];

// 🔐 find first free slot (1 or 2) ignoring rejected requests
        const slotRes = await client.query(
          `
          SELECT MIN(s) AS next_slot
          FROM generate_series(1, 2) s
          WHERE s NOT IN (
            SELECT service_slot
            FROM services
            WHERE user_id = $1
              AND status IN ('pending', 'active')
          )
          `,
          [req.user.id]
        );

        const serviceSlot = slotRes.rows[0].next_slot;

        if (!serviceSlot) {
          throw new Error("No available service slots");
        }
        


        const svcRes = await client.query(
          `
          INSERT INTO services
            (service_request_id, user_id, service_slot, category, description, location, phone, whatsapp)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          RETURNING id
          `,
          [
            serviceRequestId,
            req.user.id,
            serviceSlot,
            svc.category,
            svc.description,
            svc.location,
            svc.phone,
            svc.whatsapp
          ]
        );

        const serviceId = svcRes.rows[0].id;

        const imagesForService = req.files.filter(
          f => f.fieldname === `service_${i + 1}_images`
        );

        if (imagesForService.length === 0) {
          throw new Error("Each service must have at least one image");
        }

        for (const img of imagesForService) {
          uploadedImages.push(img.path);
          await client.query(
            `INSERT INTO service_images (service_id, image_url)
             VALUES ($1,$2)`,
            [serviceId, img.path]
          );
        }
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Service request submitted for review"
      });

    } catch (err) {
      await client.query("ROLLBACK");

      // 🔥 cleanup Cloudinary uploads on failure
      for (const url of uploadedImages) {
        const publicId = url.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      console.error("SERVICE REQUEST ERROR:", err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

/* ======================================================
   🔐 USER: MY SERVICES
   GET /api/services/mine
====================================================== */
router.get("/mine", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        category,
        description,
        location,
        phone,
        whatsapp,
        status,
        created_at
      FROM services
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("MY SERVICES ERROR:", err);
    res.status(500).json({ error: "Failed to load services" });
  }
});

/* ======================================================
   🔐 ADMIN: PENDING SERVICES
====================================================== */
router.get("/admin/pending", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const result = await pool.query(
    `
    SELECT s.*, u.email AS user_email
    FROM services s
    JOIN users u ON u.id = s.user_id
    WHERE s.status = 'pending'
    ORDER BY s.created_at ASC
    `
  );

  res.json(result.rows);
});

/* ======================================================
   PUBLIC: BROWSE ACTIVE SERVICES
   GET /api/services
====================================================== */
router.get("/", async (req, res) => {
  try {
    const { location, category } = req.query;

    const result = await pool.query(
      `
      SELECT
        s.id,
        s.category,
        s.description,
        s.location,
        s.phone,
        s.whatsapp,
        s.created_at,
        u.first_name,
        u.email,
        (
          SELECT image_url
          FROM service_images
          WHERE service_id = s.id
          LIMIT 1
        ) AS image
      FROM services s
      JOIN users u ON u.id = s.user_id
      WHERE s.status = 'active'
      AND ($1::text IS NULL OR s.location = $1)
      AND ($2::text IS NULL OR s.category = $2)
      ORDER BY s.created_at DESC
      `,
      [location || null, category || null]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("LOAD SERVICES ERROR:", err);
    res.status(500).json({ error: "Failed to load services" });
  }
});

/* ======================================================
   🔐 USER: SERVICE SLOT USAGE
   GET /api/services/usage
====================================================== */
router.get("/usage", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT COUNT(*)::int AS used
      FROM services
      WHERE user_id = $1
        AND status IN ('pending', 'active')
      `,
      [req.user.id]
    );

    res.json({
      used: result.rows[0].used,
      max: 2
    });
  } catch (err) {
    console.error("SERVICE USAGE ERROR:", err);
    res.status(500).json({ error: "Failed to load service usage" });
  }
});


/* ======================================================
   PUBLIC: SINGLE SERVICE
   GET /api/services/:id
====================================================== */
router.get("/:id", async (req, res) => {
  const serviceId = Number(req.params.id);

  // 🔒 prevent /usage, /request, etc. from reaching Postgres
  if (!Number.isInteger(serviceId)) {
    return res.status(400).json({ error: "Invalid service ID" });
  }

  try {
    const serviceRes = await pool.query(
      `
      SELECT s.*, u.first_name, u.email
      FROM services s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = $1 AND s.status = 'active'
      `,
      [serviceId]
    );
    
    const imagesRes = await pool.query(
  `SELECT image_url FROM service_images WHERE service_id = $1`,
  [serviceId]
);

const ratingRes = await pool.query(
  `
  SELECT
    COUNT(*)::int AS total_reviews,
    ROUND(AVG(rating), 1) AS average_rating
  FROM service_reviews
  WHERE service_id = $1
  `,
  [serviceId]
);

    res.json({
      ...serviceRes.rows[0],
      images: imagesRes.rows,
      rating: ratingRes.rows[0]
    });

  } catch (err) {
    console.error("LOAD SERVICE ERROR:", err);
    res.status(500).json({ error: "Failed to load service" });
  }
});

/* ======================================================
   🔐 USER: UPDATE OWN SERVICE (NO CATEGORY CHANGE)
   PUT /api/services/:id
====================================================== */
router.put("/:id", auth, async (req, res) => {
  try {
    const { description, location, phone, whatsapp } = req.body;
    const serviceId = req.params.id;

    if (!description || !location || !phone || !whatsapp) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      `
      UPDATE services
      SET
        description = $1,
        location = $2,
        phone = $3,
        whatsapp = $4,
        updated_at = NOW()
      WHERE id = $5 AND user_id = $6
      RETURNING *
      `,
      [
        description,
        location,
        phone,
        whatsapp,
        serviceId,
        req.user.id
      ]
    );

    if (!result.rows.length) {
      return res.status(403).json({ error: "Unauthorized or service not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("UPDATE SERVICE ERROR:", err);
    res.status(500).json({ error: "Failed to update service" });
  }
});

/* ======================================================
   🔐 USER: TOGGLE SERVICE STATUS
   PATCH /api/services/:id/status
====================================================== */
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const serviceId = req.params.id;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      `
      UPDATE services
      SET status = $1
      WHERE id = $2 AND user_id = $3 AND status != 'pending'
      RETURNING *
      `,
      [status, serviceId, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(403).json({
        error: "Unauthorized or service pending approval"
      });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("SERVICE STATUS ERROR:", err);
    res.status(500).json({ error: "Failed to update service" });
  }
});

/* ======================================================
   🔐 ADMIN: APPROVE SERVICE
   PATCH /api/services/:id/approve
====================================================== */
router.patch(
  "/:id/approve",
  auth,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { id } = req.params;

      const result = await pool.query(
        `
        UPDATE services
        SET status = 'active'
        WHERE id = $1 AND status = 'pending'
        RETURNING *
        `,
        [id]
      );

      if (!result.rows.length) {
        return res.status(400).json({
          error: "Service not found or already processed"
        });
      }

      res.json({
        success: true,
        service: result.rows[0]
      });

    } catch (err) {
      console.error("APPROVE SERVICE ERROR:", err);
      res.status(500).json({ error: "Failed to approve service" });
    }
  }
);

/* ======================================================
   🔐 ADMIN: REJECT SERVICE
   PATCH /api/services/:id/reject
====================================================== */
router.patch(
  "/:id/reject",
  auth,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { id } = req.params;

      const result = await pool.query(
        `
        UPDATE services
        SET status = 'rejected'
        WHERE id = $1 AND status = 'pending'
        RETURNING *
        `,
        [id]
      );

      if (!result.rows.length) {
        return res.status(400).json({
          error: "Service not found or already processed"
        });
      }

      res.json({ success: true });

    } catch (err) {
      console.error("REJECT SERVICE ERROR:", err);
      res.status(500).json({ error: "Failed to reject service" });
    }
  }
);


module.exports = router;
