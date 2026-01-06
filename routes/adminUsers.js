const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * ADMIN: GET USERS (PAGINATED)
 * GET /api/admin/users?verified=false&page=1&limit=20
 */
router.get(
  "/users",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const verifiedFilter =
        req.query.verified === undefined
          ? null
          : req.query.verified === "true";

      let whereClause = "";
      let params = [];

      if (verifiedFilter !== null) {
        whereClause = "WHERE verified = $1";
        params.push(verifiedFilter);
      }

      const usersQuery = `
        SELECT id, first_name, last_name, email, role, verified
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `;

      const countQuery = `
        SELECT COUNT(*) FROM users
        ${whereClause}
      `;

      const usersRes = await pool.query(usersQuery, [
        ...params,
        limit,
        offset
      ]);

      const countRes = await pool.query(countQuery, params);

      res.json({
        users: usersRes.rows,
        total: Number(countRes.rows[0].count),
        page,
        limit
      });
    } catch (err) {
      console.error("ADMIN USERS ERROR:", err);
      res.status(500).json({ error: "Failed to load users" });
    }
  }
);

module.exports = router;
