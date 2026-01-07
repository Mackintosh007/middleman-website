const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const pool = require("../db");

/**
 * ===============================
 * PAYSTACK WEBHOOK
 * ===============================
 * - Uses RAW body (required by Paystack)
 * - Verifies signature
 * - Confirms successful payment
 * - Marks order as PAID (escrow funded)
 * - DOES NOT release escrow
 */
router.post(
  "/paystack",
  express.raw({ type: "*/*" }),
  async (req, res) => {
    try {
      const secret = process.env.PAYSTACK_SECRET_KEY;

      // 🔐 Verify Paystack signature
      const hash = crypto
        .createHmac("sha512", secret)
        .update(req.body)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        console.warn("⚠️ Invalid Paystack signature");
        return res.sendStatus(401);
      }

      const event = JSON.parse(req.body.toString());
      console.log("✅ Webhook received:", event.event);
      console.log("📦 Full event data:", event.data);
      console.log("🧾 Metadata:", event.data?.metadata);

      // ✅ Only handle successful charges
      if (event.event !== "charge.success") {
        return res.sendStatus(200);
      }

      const metadata = event.data?.metadata;
      const orderId = metadata?.order_id;

      if (!orderId) {
        console.warn("⚠️ Paystack event missing order_id");
        return res.sendStatus(200);
      }

      // 🔒 Mark order as PAID (escrow funded)
      await pool.query(
        `
        UPDATE orders
        SET status = 'paid', paid_at = NOW()
        WHERE id = $1 AND status = 'pending'
        `,
        [orderId]
      );

      console.log(`✅ Escrow funded for order ${orderId}`);

      return res.sendStatus(200);
    } catch (err) {
      console.error("❌ PAYSTACK WEBHOOK ERROR:", err);
      return res.sendStatus(500);
    }
  }
);

module.exports = router;
