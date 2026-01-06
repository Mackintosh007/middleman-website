const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const pool = require("../db");
const banks = require("../utils/banks");

/**
 * VERIFY BANK ACCOUNT (SELLER)
 */
router.post(
  "/verify-bank",
  auth,
  roles("agent", "individual_seller"),
  async (req, res) => {
    try {
      const { bank_name, account_number } = req.body;

      if (!bank_name || !account_number) {
        return res.status(400).json({
          error: "Bank name and account number are required",
        });
      }

      const bankCode = banks[bank_name];

      if (!bankCode) {
        return res.status(400).json({
          error: "Unsupported bank",
        });
      }

      // 🔍 Verify via Paystack
      const response = await axios.get(
        "https://api.paystack.co/bank/resolve",
        {
          params: {
            account_number,
            bank_code: bankCode,
          },
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const account_name = response.data.data.account_name;

      // 💾 SAVE VERIFIED BANK DETAILS (CONNECTED TO WITHDRAWALS)
      await pool.query(
        `
        UPDATE users
        SET
          bank_name = $1,
          account_number = $2,
          account_name = $3,
          bank_verified = true
        WHERE id = $4
        `,
        [
          bank_name,
          account_number,
          account_name,
          req.user.id
        ]
      );

      res.json({
        bank_name,
        account_number,
        account_name,
        verified: true
      });

    } catch (err) {
      console.error("BANK VERIFY ERROR:", err.response?.data || err.message);
      res.status(400).json({
        error: "Bank verification failed",
      });
    }
  }
);

module.exports = router;
