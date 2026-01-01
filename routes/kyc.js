const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

/**
 * SUBMIT / UPDATE KYC
 */
router.post(
  "/",
  auth,
  roles("agent", "individual_seller"),
  async (req, res) => {
    const {
      id_type,
      id_document,
      bank_name,
      account_number,
      account_name
    } = req.body;

    await pool.query(
      `INSERT INTO seller_kyc
       (user_id, id_type, id_document, bank_name, account_number, account_name, status, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,'submitted',NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         id_type = EXCLUDED.id_type,
         id_document = EXCLUDED.id_document,
         bank_name = EXCLUDED.bank_name,
         account_number = EXCLUDED.account_number,
         account_name = EXCLUDED.account_name,
         status = 'submitted',
         submitted_at = NOW()`,
      [
        req.user.id,
        id_type,
        id_document,
        bank_name,
        account_number,
        account_name
      ]
    );

    res.json({ message: "KYC submitted successfully" });
  }
);

/**
 * GET OWN KYC STATUS
 */
router.get(
  "/me",
  auth,
  roles("agent", "individual_seller"),
  async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM seller_kyc WHERE user_id = $1",
      [req.user.id]
    );

    res.json(result.rows[0] || { status: "not_started" });
  }
);

module.exports = router;
