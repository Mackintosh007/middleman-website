const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
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

      res.json({
        account_name: response.data.data.account_name,
        account_number,
        bank_name,
      });
    } catch (err) {
      console.error(err.response?.data || err.message);

      res.status(400).json({
        error: "Bank verification failed",
      });
    }
  }
);

module.exports = router;
