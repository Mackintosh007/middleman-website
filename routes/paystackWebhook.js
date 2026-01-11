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
 * - Handles:
 *   ✅ charge.success  (escrow funding)
 *   ✅ transfer.success (seller payout success)
 *   ✅ transfer.failed  (seller payout failure → refund)
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

      /* ======================================================
         1️⃣ PAYMENT SUCCESS (ESCROW FUNDING)
         ⚠️ DO NOT TOUCH — EXISTING WORKING LOGIC
      ====================================================== */
      if (event.event === "charge.success") {
        const metadata = event.data?.metadata;
        const orderId = metadata?.order_id;

        if (!orderId) {
          console.warn("⚠️ Paystack charge missing order_id");
          return res.sendStatus(200);
        }

        await pool.query(
          `
          UPDATE orders
          SET status = 'paid',
              escrow_status = 'funded'
          WHERE id = $1 AND status = 'pending'
          `,
          [orderId]
        );

        console.log(`✅ Escrow funded for order ${orderId}`);
        return res.sendStatus(200);
      }

      /* ======================================================
         2️⃣ TRANSFER SUCCESS (SELLER PAYOUT COMPLETE)
      ====================================================== */
      if (event.event === "transfer.success") {
        const reference = event.data?.reference;

        if (!reference) {
          return res.sendStatus(200);
        }

        const withdrawalRes = await pool.query(
          `
          SELECT *
          FROM withdrawals
          WHERE paystack_reference = $1
          `,
          [reference]
        );

        if (!withdrawalRes.rows.length) {
          return res.sendStatus(200);
        }

        const withdrawal = withdrawalRes.rows[0];

        await pool.query("BEGIN");

        // Mark withdrawal as completed
        await pool.query(
          `
          UPDATE withdrawals
          SET payout_status = 'success'
          WHERE id = $1
          `,
          [withdrawal.id]
        );

        // Remove funds from pending
        await pool.query(
          `
          UPDATE wallets
          SET
            pending = pending - $1,
            updated_at = NOW()
          WHERE user_id = $2
          `,
          [withdrawal.amount, withdrawal.user_id]
        );

        await pool.query("COMMIT");

        console.log(`✅ Withdrawal payout completed: ${reference}`);
        return res.sendStatus(200);
      }

      /* ======================================================
         3️⃣ TRANSFER FAILED (REFUND SELLER WALLET)
      ====================================================== */
      if (event.event === "transfer.failed") {
        const reference = event.data?.reference;

        if (!reference) {
          return res.sendStatus(200);
        }

        const withdrawalRes = await pool.query(
          `
          SELECT *
          FROM withdrawals
          WHERE paystack_reference = $1
          `,
          [reference]
        );

        if (!withdrawalRes.rows.length) {
          return res.sendStatus(200);
        }

        const withdrawal = withdrawalRes.rows[0];

        await pool.query("BEGIN");

        // Mark withdrawal failed
        await pool.query(
          `
          UPDATE withdrawals
          SET payout_status = 'failed'
          WHERE id = $1
          `,
          [withdrawal.id]
        );

        // Refund wallet
        await pool.query(
          `
          UPDATE wallets
          SET
            balance = balance + $1,
            pending = pending - $1,
            updated_at = NOW()
          WHERE user_id = $2
          `,
          [withdrawal.amount, withdrawal.user_id]
        );

        await pool.query("COMMIT");

        console.warn(`⚠️ Withdrawal payout failed: ${reference}`);
        return res.sendStatus(200);
      }

      // Ignore all other Paystack events safely
      return res.sendStatus(200);

    } catch (err) {
      console.error("❌ PAYSTACK WEBHOOK ERROR:", err);
      return res.sendStatus(500);
    }
  }
);

module.exports = router;
