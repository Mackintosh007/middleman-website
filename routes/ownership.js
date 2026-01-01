const express = require("express");
const router = express.Router();
const pool = require("../db");

const auth = require("../middleware/auth");
const roles = require("../middleware/roles");


/**
 * TRANSFER OWNERSHIP
 * Called ONLY when order is completed
 */
router.post("/transfer", async (req, res) => {
  try {
    const { order_id } = req.body;

    // get order
    const orderRes = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND status = 'completed'",
      [order_id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(400).json({ message: "Order not completed or not found" });
    }

    const order = orderRes.rows[0];

    // close previous ownership
    await pool.query(
      `
      UPDATE property_ownership_history
      SET end_date = NOW()
      WHERE property_id = $1 AND end_date IS NULL
      `,
      [order.property_id]
    );

    // insert new ownership
    await pool.query(
      `
      INSERT INTO property_ownership_history (property_id, owner_id)
      VALUES ($1, $2)
      `,
      [order.property_id, order.buyer_id]
    );

    // update property
    await pool.query(
      `
      UPDATE properties
      SET owner_id = $1,
          status = 'sold',
          sold_date = NOW()
      WHERE id = $2
      `,
      [order.buyer_id, order.property_id]
    );

    res.json({ message: "Ownership transferred successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * VIEW OWNERSHIP HISTORY
 */
router.get("/:property_id", async (req, res) => {
  const history = await pool.query(
    `
    SELECT poh.*, u.first_name, u.last_name
    FROM property_ownership_history poh
    JOIN users u ON poh.owner_id = u.id
    WHERE poh.property_id = $1
    ORDER BY poh.start_date
    `,
    [req.params.property_id]
  );

  res.json(history.rows);
});

module.exports = router;
