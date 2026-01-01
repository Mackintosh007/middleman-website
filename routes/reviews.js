const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

/**
 * CREATE REVIEW (buyer only, completed orders only)
 */
router.post("/", auth, async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;

    // Fetch order
    const orderRes = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [order_id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];

    // Authorization checks
    if (order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: "Not your order" });
    }

    if (order.status !== "completed") {
      return res.status(400).json({ error: "Order not completed" });
    }

    // Prevent duplicate reviews
    const existing = await pool.query(
      `SELECT id FROM reviews WHERE order_id = $1`,
      [order_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Review already submitted" });
    }

    // Insert review
    const reviewRes = await pool.query(
      `INSERT INTO reviews
       (order_id, seller_id, buyer_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        order_id,
        order.seller_id,
        order.buyer_id,
        rating,
        comment
      ]
    );

    res.status(201).json(reviewRes.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET REVIEWS FOR SELLER
 */
router.get("/:sellerId", async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    const reviewsRes = await pool.query(
      `SELECT r.*, u.first_name
       FROM reviews r
       JOIN users u ON r.buyer_id = u.id
       WHERE r.seller_id = $1
       ORDER BY r.created_at DESC`,
      [sellerId]
    );

    const statsRes = await pool.query(
      `SELECT 
         COUNT(*) AS total_reviews,
         ROUND(AVG(rating), 1) AS average_rating
       FROM reviews
       WHERE seller_id = $1`,
      [sellerId]
    );

    res.json({
      reviews: reviewsRes.rows,
      stats: statsRes.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
