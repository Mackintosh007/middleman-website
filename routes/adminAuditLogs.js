const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

router.get(
  "/",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT 
          l.*,
          u.email AS admin_email
        FROM admin_audit_logs l
        LEFT JOIN users u ON u.id = l.admin_id
        ORDER BY l.created_at DESC
        LIMIT 200
        `
      );

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to load audit logs" });
    }
  }
);

module.exports = router;
