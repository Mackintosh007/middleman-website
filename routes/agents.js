const express = require("express");
const router = express.Router();
const pool = require("../db");

const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * GET ALL AGENTS (ADMIN ONLY)
 */
router.get(
  "/",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT 
          agents.id,
          agents.verified,
          users.first_name,
          users.last_name,
          users.email
         FROM agents
         JOIN users ON agents.user_id = users.id`
      );

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * VERIFY AGENT (ADMIN ONLY)
 */
router.patch(
  "/:id/verify",
  auth,
  roles("admin"),
  async (req, res) => {
    try {
      const agentId = req.params.id;

      const result = await pool.query(
        `UPDATE agents
         SET verified = true
         WHERE id = $1
         RETURNING *`,
        [agentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Agent not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET AGENT PUBLIC PROFILE
 */
router.get("/:id", async (req, res) => {
  try {
    const agentId = req.params.id;

    const agentRes = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, a.verified
       FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [agentId]
    );

    if (agentRes.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const listingsRes = await pool.query(
      `SELECT id, title, price, location
       FROM properties
       WHERE owner_id = $1`,
      [agentRes.rows[0].id]
    );

    res.json({
      agent: agentRes.rows[0],
      listings: listingsRes.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
