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

      /* ======================================================
         1️⃣ VERIFY BANK ACCOUNT WITH PAYSTACK (UNCHANGED)
      ====================================================== */
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

      /* ======================================================
         2️⃣ SAVE VERIFIED BANK DETAILS (UNCHANGED)
      ====================================================== */
      const userRes = await pool.query(
        `
        UPDATE users
        SET
          bank_name = $1,
          account_number = $2,
          account_name = $3,
          bank_verified = true
        WHERE id = $4
        RETURNING
          id,
          first_name,
          last_name,
          bank_name,
          account_number,
          account_name,
          paystack_subaccount_code
        `,
        [
          bank_name,
          account_number,
          account_name,
          req.user.id
        ]
      );

      const user = userRes.rows[0];

      /* ======================================================
         3️⃣ CREATE PAYSTACK SUBACCOUNT (NEW – SAFE)
         - Runs ONCE per seller
         - Does NOT affect withdrawals
      ====================================================== */
      if (!user.paystack_subaccount_code) {
        const subRes = await axios.post(
          "https://api.paystack.co/subaccount",
          {
            business_name: `${user.first_name} ${user.last_name}`,
            settlement_bank: bankCode,
            account_number: account_number,
            percentage_charge: 94, // Seller gets 94%
            description: "Middleman seller subaccount"
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        const subaccountCode = subRes.data.data.subaccount_code;

        await pool.query(
          `
          UPDATE users
          SET paystack_subaccount_code = $1
          WHERE id = $2
          `,
          [subaccountCode, req.user.id]
        );
      }

      /* ======================================================
         4️⃣ RESPONSE
      ====================================================== */
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
