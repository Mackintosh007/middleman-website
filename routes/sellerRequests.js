const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * USER: Request to become seller or agent
 */
router.post("/", auth, async (req, res) => {
  try {
    const { requested_role } = req.body;

    if (!["individual_seller", "agent"].includes(requested_role)) {
      return res.status(400).json({ error: "Invalid role request" });
    }

    const existing = await pool.query(
      `SELECT id FROM seller_requests
       WHERE user_id = $1 AND status = 'pending'`,
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Request already pending" });
    }

    const result = await pool.query(
      `INSERT INTO seller_requests (user_id, requested_role)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, requested_role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN: View pending requests
 */
router.get("/", auth, roles("admin"), async (req, res) => {
  const result = await pool.query(
    `SELECT sr.*, u.email, u.first_name, u.last_name
     FROM seller_requests sr
     JOIN users u ON u.id = sr.user_id
     WHERE sr.status = 'pending'
     ORDER BY sr.created_at DESC`
  );

  res.json(result.rows);
});

/**
 * ADMIN: CORE STATUS HANDLER
 */
router.patch("/:id", auth, roles("admin"), async (req, res) => {
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reqRes = await client.query(
      "SELECT * FROM seller_requests WHERE id = $1 FOR UPDATE",
      [req.params.id]
    );

    if (!reqRes.rows.length) {
      throw new Error("Request not found");
    }

    const request = reqRes.rows[0];

    await client.query(
      "UPDATE seller_requests SET status = $1 WHERE id = $2",
      [status, req.params.id]
    );

    if (status === "approved") {
      await client.query(
        "UPDATE users SET role = $1 WHERE id = $2",
        [request.requested_role, request.user_id]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * ADMIN: ALIAS ROUTES (FRONTEND SAFE)
 */
router.patch("/:id/approve", auth, roles("admin"), (req, res) => {
  req.body.status = "approved";
  router.handle(req, res);
});

router.patch("/:id/reject", auth, roles("admin"), (req, res) => {
  req.body.status = "rejected";
  router.handle(req, res);
});

module.exports = router;
