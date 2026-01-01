const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * VIEW SUBMITTED KYCs
 */
router.get(
  "/kyc",
  auth,
  roles("admin"),
  async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM seller_kyc WHERE status = 'submitted'"
    );
    res.json(result.rows);
  }
);

/**
 * APPROVE / REJECT KYC
 */
router.post(
  "/kyc/:userId",
  auth,
  roles("admin"),
  async (req, res) => {
    const { status } = req.body; // approved | rejected

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await pool.query(
      `UPDATE seller_kyc
       SET status = $1,
           reviewed_at = NOW()
       WHERE user_id = $2`,
      [status, req.params.userId]
    );

    res.json({ message: `KYC ${status}` });
  }
);

module.exports = router;
