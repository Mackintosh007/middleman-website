const pool = require("../db");
const sendEmail = require("../utils/sendEmail");

const AUTO_RELEASE_HOURS = 36;

async function autoReleaseEscrow() {
  try {
    const result = await pool.query(
      `
      SELECT 
        o.id,
        o.amount,
        o.platform_fee,
        o.created_at,
        p.id AS property_id,
        p.title,
        s.id AS seller_id,
        s.email AS seller_email,
        s.first_name AS seller_name,
        b.email AS buyer_email,
        b.first_name AS buyer_name
      FROM orders o
      JOIN properties p ON p.id = o.property_id
      JOIN users s ON s.id = o.seller_id
      JOIN users b ON b.id = o.buyer_id
      WHERE 
        o.status = 'paid'
        AND o.delivery_confirmed = true
        AND o.released_at IS NULL
        AND o.created_at <= NOW() - INTERVAL '${AUTO_RELEASE_HOURS} HOURS'
      `
    );

    for (const order of result.rows) {
      const sellerPayout =
        Number(order.amount) - Number(order.platform_fee);

      // 🔐 TRANSACTION PER ORDER
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // 1️⃣ RELEASE ESCROW
        await client.query(
          `
          UPDATE orders
          SET status = 'completed',
              released_at = NOW()
          WHERE id = $1
          `,
          [order.id]
        );

        // 2️⃣ MARK PROPERTY SOLD
        await client.query(
          `
          UPDATE properties
          SET status = 'sold',
              sold_date = NOW()
          WHERE id = $1
          `,
          [order.property_id]
        );

        // 3️⃣ ✅ SAFE WALLET CREDIT (FIX)
        await client.query(
          `
          INSERT INTO wallets (user_id, balance)
          VALUES ($1, $2)
          ON CONFLICT (user_id)
          DO UPDATE SET
            balance = wallets.balance + EXCLUDED.balance,
            updated_at = NOW()
          `,
          [order.seller_id, sellerPayout]
        );

        await client.query("COMMIT");

      } catch (txErr) {
        await client.query("ROLLBACK");
        throw txErr;
      } finally {
        client.release();
      }

      // 📧 EMAIL SELLER
      await sendEmail({
        to: order.seller_email,
        subject: "Escrow Auto-Released",
        html: `
          <p>Hello ${order.seller_name},</p>
          <p>The escrow for <strong>${order.title}</strong> has been automatically released.</p>
          <p><strong>Amount credited:</strong> ₦${sellerPayout.toLocaleString()}</p>
          <p>This happened because delivery was confirmed and ${AUTO_RELEASE_HOURS} hours elapsed.</p>
        `,
      });

      // 📧 EMAIL BUYER
      await sendEmail({
        to: order.buyer_email,
        subject: "Escrow Auto-Released",
        html: `
          <p>Hello ${order.buyer_name},</p>
          <p>The escrow for <strong>${order.title}</strong> has been automatically released.</p>
          <p>If there was an issue, please contact support.</p>
        `,
      });
    }

    if (result.rows.length > 0) {
      console.log(`✅ Auto-released ${result.rows.length} escrow orders`);
    }
  } catch (err) {
    console.error("AUTO-RELEASE ERROR:", err);
  }
}

module.exports = autoReleaseEscrow;
