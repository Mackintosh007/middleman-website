const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const pool = require("../db");

/**
 * ===============================
 * PAYSTACK WEBHOOK
 * ===============================
 * - Verifies Paystack signature
 * - Confirms successful payment
 * - Marks order as PAID (escrow funded)
 * - DOES NOT release escrow
 */
router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.PAYSTACK_SECRET_KEY;

      const hash = crypto
        .createHmac("sha512", secret)
        .update(req.body)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        return res.status(401).send("Invalid signature");
      }

      const event = JSON.parse(req.body.toString());

      // ✅ Only handle successful charges
      if (event.event !== "charge.success") {
        return res.sendStatus(200);
      }

      const metadata = event.data.metadata;
      const orderId = metadata?.order_id;

      if (!orderId) {
        return res.sendStatus(200);
      }

      // 🔒 Update order to PAID (funds secured)
      await pool.query(
        `
        UPDATE orders
        SET status = 'paid'
        WHERE id = $1 AND status = 'pending'
        `,
        [orderId]
      );

      return res.sendStatus(200);
    } catch (err) {
      console.error("PAYSTACK WEBHOOK ERROR:", err);
      return res.sendStatus(500);
    }
  }
);

module.exports = router;
