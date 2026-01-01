const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

const PLATFORM_FEE_PERCENT = 6.5;
const DELIVERY_FEE = 1300;

/**
 * CREATE ESCROW ORDER
 * Buyer pays: item price + delivery
 * Seller pays: 6.5% commission (later)
 */
router.post("/", auth, roles("customer"), async (req, res) => {
  try {
    const { property_id } = req.body;

    const propRes = await pool.query(
      `SELECT id, owner_id, price, status, revenue_type
       FROM properties WHERE id = $1`,
      [property_id]
    );

    if (!propRes.rows.length) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const property = propRes.rows[0];

    // 🔒 ENFORCEMENT
    if (property.revenue_type !== "escrow") {
      return res
        .status(403)
        .json({ error: "This listing does not support escrow" });
    }

    if (property.status !== "active") {
      return res
        .status(400)
        .json({ error: "Listing is not active" });
    }

    if (property.owner_id === req.user.id) {
      return res
        .status(403)
        .json({ error: "You cannot buy your own listing" });
    }

    // 💰 CALCULATIONS
    const platformFee = Number(
      (property.price * PLATFORM_FEE_PERCENT / 100).toFixed(2)
    );

    const deliveryFee = DELIVERY_FEE;

    const totalAmount = property.price + deliveryFee;

    // 🧾 CREATE ORDER
    const orderRes = await pool.query(
      `INSERT INTO orders
       (property_id, buyer_id, seller_id, amount, platform_fee, delivery_fee, total_amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'escrow_pending')
       RETURNING *`,
      [
        property.id,
        req.user.id,
        property.owner_id,
        property.price,
        platformFee,
        deliveryFee,
        totalAmount,
      ]
    );

    // 🔒 LOCK LISTING
    await pool.query(
      "UPDATE properties SET status = 'pending' WHERE id = $1",
      [property.id]
    );

    res.status(201).json(orderRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
