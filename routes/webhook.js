const express = require("express");
const crypto = require("crypto");
const pool = require("../db");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

router.post(
  "/paystack",
  express.raw({ type: "*/*" }), // ✅ REQUIRED
  async (req, res) => {
    try {
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(req.body)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        return res.status(401).send("Invalid signature");
      }

      const event = JSON.parse(req.body.toString());

      /* ===============================
         PAYMENT SUCCESS
      =============================== */
      if (event.event === "charge.success") {
        const orderId = event.data?.metadata?.order_id;
        if (!orderId) return res.sendStatus(200);

        // ✅ Update order (DO NOT CHANGE STATUS NAME)
        await pool.query(
          `
          UPDATE orders
          SET status = 'paid'
          WHERE id = $1 AND status = 'pending'
          `,
          [orderId]
        );

        // 🔔 Notify seller
        const sellerRes = await pool.query(
          `
          SELECT u.email
          FROM orders o
          JOIN users u ON u.id = o.seller_id
          WHERE o.id = $1
          `,
          [orderId]
        );

        if (sellerRes.rows.length) {
          await sendEmail({
            to: sellerRes.rows[0].email,
            subject: "Order Paid – Please Deliver",
            html: `
              <p>Your listing has been paid for.</p>
              <p>Please deliver promptly and click <strong>Mark as Delivered</strong> on your dashboard.</p>
            `
          });
        }
      }

      return res.sendStatus(200);

    } catch (err) {
      console.error("PAYSTACK WEBHOOK ERROR:", err);
      return res.sendStatus(500);
    }
  }
);

module.exports = router;
