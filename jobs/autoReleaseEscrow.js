const pool = require("../db");

/**
 * Auto-release escrow after timeout
 * Runs via node-cron
 */
async function autoReleaseEscrow() {
  try {
    const result = await pool.query(`
  SELECT id, seller_id, amount
  FROM orders
  WHERE status = 'delivered'
    AND updated_at < NOW() - INTERVAL '48 hours'
`);


    for (const order of result.rows) {
      await pool.query("BEGIN");

      await pool.query(
        `UPDATE orders SET status = 'completed' WHERE id = $1`,
        [order.id]
      );

      await pool.query(
        `
        UPDATE wallets
        SET balance = balance + $1
        WHERE user_id = $2
        `,
        [order.amount, order.seller_id]
      );

      await pool.query("COMMIT");
    }

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("AUTO RELEASE ESCROW ERROR:", err);
  }
}

module.exports = autoReleaseEscrow;
