const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const sendEmail = require("../utils/sendEmail");
const axios = require("axios");
const auditLog = require("../utils/auditLog");

const PLATFORM_FEE_PERCENT = 6.5;
const DELIVERY_FEE = 800;

/**
 * ===============================
 * GET MY ORDERS (BUYER / SELLER)
 * ===============================
 */
router.get("/my", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        o.*,
        p.title,
        p.revenue_type
      FROM orders o
      JOIN properties p ON p.id = o.property_id
      WHERE o.buyer_id = $1 OR o.seller_id = $1
      ORDER BY o.created_at DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET MY ORDERS ERROR:", err);
    res.status(500).json({ error: "Unable to fetch orders" });
  }
});

/**
 * ===============================
 * CREATE ESCROW ORDER
 * ===============================
 */
router.post(
  "/",
  auth,
  roles("customer", "agent", "individual_seller", "admin"),
  async (req, res) => {
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

      if (property.revenue_type !== "escrow") {
        return res.status(403).json({
          error: "This listing does not support escrow",
        });
      }

      if (property.status !== "active") {
        return res.status(400).json({
          error: "Listing is not active",
        });
      }

      if (property.owner_id === req.user.id) {
        return res.status(403).json({
          error: "You cannot buy your own listing",
        });
      }

      const platformFee = Number(
        ((property.price * PLATFORM_FEE_PERCENT) / 100).toFixed(2)
      );

      const deliveryFee = DELIVERY_FEE;
      const totalAmount = property.price + deliveryFee;

      const orderRes = await pool.query(
        `
        INSERT INTO orders
        (property_id, buyer_id, seller_id, amount, platform_fee, delivery_fee, total_amount, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
        RETURNING *
        `,
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

      await pool.query(
        "UPDATE properties SET status = 'pending' WHERE id = $1",
        [property.id]
      );

      res.status(201).json(orderRes.rows[0]);
    } catch (err) {
      console.error("ESCROW CREATE ERROR:", err);
      res.status(500).json({ error: "Unable to create escrow order" });
    }
  }
);

/**
 * ===============================
 * INITIATE PAYSTACK PAYMENT
 * ===============================
 */
router.post("/:id/pay", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const orderRes = await pool.query(
      `
      SELECT o.id, o.total_amount, o.status, u.email AS buyer_email
      FROM orders o
      JOIN users u ON u.id = o.buyer_id
      WHERE o.id = $1
      `,
      [id]
    );

    if (!orderRes.rows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];

    if (order.status !== "pending") {
      return res.status(400).json({
        error: "Order cannot be paid for",
      });
    }

    const paystackAmount = Math.round(Number(order.total_amount) * 100);

    const payRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: order.buyer_email,
        amount: paystackAmount,
        reference: `MM_ESCROW_${order.id}_${Date.now()}`,
        callback_url: `${process.env.FRONTEND_URL}/payment-success`,
        metadata: {
          order_id: order.id,
          escrow: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      authorization_url: payRes.data.data.authorization_url,
    });
  } catch (err) {
    console.error("PAYSTACK INIT ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Unable to initiate payment" });
  }
});

/**
 * ===============================
 * SELLER MARK DELIVERY
 * ===============================
 */
router.patch(
  "/:id/mark-delivered",
  auth,
  roles("agent", "individual_seller", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const orderRes = await pool.query(
        `
        SELECT id, seller_id, status, delivery_confirmed
        FROM orders
        WHERE id = $1
        `,
        [id]
      );

      if (!orderRes.rows.length) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderRes.rows[0];

      if (
        order.seller_id !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (order.status !== "paid") {
        return res.status(400).json({
          error: "Order must be paid before delivery",
        });
      }

      if (order.delivery_confirmed) {
        return res.status(400).json({
          error: "Delivery already marked",
        });
      }

      await pool.query(
        `UPDATE orders SET delivery_confirmed = true WHERE id = $1`,
        [id]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * BUYER CONFIRMS DELIVERY
 * PATCH /api/orders/:id/confirm-delivery
 */
router.patch(
  "/:id/confirm-delivery",
  auth,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const orderId = req.params.id;

      await client.query("BEGIN");

      // 1️⃣ Load order WITH LOCK
      const orderRes = await client.query(
        `
        SELECT *
        FROM orders
        WHERE id = $1
          AND buyer_id = $2
        FOR UPDATE
        `,
        [orderId, req.user.id]
      );

      if (!orderRes.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderRes.rows[0];

      // 2️⃣ Prevent double release
      if (order.released_at) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Escrow already released"
        });
      }

      // 3️⃣ Seller payout calculation
      const sellerPayout =
        Number(order.amount) - Number(order.platform_fee);

      // 4️⃣ Mark order completed + delivery confirmed
      await client.query(
        `
        UPDATE orders
        SET
          delivery_confirmed = true,
          status = 'completed',
          released_at = NOW()
        WHERE id = $1
        `,
        [order.id]
      );

      // 5️⃣ Credit seller wallet (CREATE IF NOT EXISTS)
      await client.query(
        `
        INSERT INTO wallets (user_id, balance)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET
          balance = wallets.balance + $2,
          updated_at = NOW()
        `,
        [order.seller_id, sellerPayout]
      );

      // 6️⃣ Mark property sold
      await client.query(
        `
        UPDATE properties
        SET status = 'sold',
            sold_date = NOW()
        WHERE id = $1
        `,
        [order.property_id]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Delivery confirmed and seller paid",
        seller_payout: sellerPayout
      });

    } catch (err) {
      await client.query("ROLLBACK");
      console.error("CONFIRM DELIVERY ERROR:", err);
      res.status(500).json({ error: "Failed to confirm delivery" });
    } finally {
      client.release();
    }
  }
);


/**
 * ===============================
 * GET MY ORDERS (BUYER / SELLER)
 * ===============================
 */
router.get("/my", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        o.*,
        p.title,
        p.revenue_type
      FROM orders o
      JOIN properties p ON p.id = o.property_id
      WHERE o.buyer_id = $1 OR o.seller_id = $1
      ORDER BY o.created_at DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET MY ORDERS ERROR:", err);
    res.status(500).json({ error: "Unable to fetch orders" });
  }
});

/**
 * ===============================
 * CREATE ESCROW ORDER
 * ===============================
 */
router.post(
  "/",
  auth,
  roles("customer", "agent", "individual_seller", "admin"),
  async (req, res) => {
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

      if (property.revenue_type !== "escrow") {
        return res.status(403).json({
          error: "This listing does not support escrow",
        });
      }

      if (property.status !== "active") {
        return res.status(400).json({
          error: "Listing is not active",
        });
      }

      if (property.owner_id === req.user.id) {
        return res.status(403).json({
          error: "You cannot buy your own listing",
        });
      }

      const platformFee = Number(
        ((property.price * PLATFORM_FEE_PERCENT) / 100).toFixed(2)
      );

      const deliveryFee = DELIVERY_FEE;
      const totalAmount = property.price + deliveryFee;

      const orderRes = await pool.query(
        `
        INSERT INTO orders
        (property_id, buyer_id, seller_id, amount, platform_fee, delivery_fee, total_amount, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
        RETURNING *
        `,
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

      await pool.query(
        "UPDATE properties SET status = 'pending' WHERE id = $1",
        [property.id]
      );

      res.status(201).json(orderRes.rows[0]);
    } catch (err) {
      console.error("ESCROW CREATE ERROR:", err);
      res.status(500).json({ error: "Unable to create escrow order" });
    }
  }
);

/**
 * ===============================
 * INITIATE PAYSTACK PAYMENT
 * ===============================
 */
router.post("/:id/pay", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const orderRes = await pool.query(
      `
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.seller_id,
        u.email AS buyer_email,
        s.paystack_subaccount_code
      FROM orders o
      JOIN users u ON u.id = o.buyer_id
      JOIN users s ON s.id = o.seller_id
      WHERE o.id = $1
      `,
      [id]
    );

    if (!orderRes.rows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];

    if (order.status !== "pending") {
      return res.status(400).json({
        error: "Order cannot be paid for",
      });
    }

    const paystackAmount = Math.round(Number(order.total_amount) * 100);

    // ✅ Build Paystack payload (SAFE EXTENSION)
    const paystackPayload = {
      email: order.buyer_email,
      amount: paystackAmount,
      reference: `MM_ESCROW_${order.id}_${Date.now()}`,
      callback_url: `${process.env.FRONTEND_URL}/payment-success`,
      metadata: {
        order_id: order.id,
        escrow: true,
      },
    };

    // ✅ Apply subaccount split ONLY if seller has one
    if (order.paystack_subaccount_code) {
      paystackPayload.subaccount = order.paystack_subaccount_code;
      paystackPayload.transaction_charge = Math.round(
        paystackAmount * (PLATFORM_FEE_PERCENT / 100)
      );
    }

    const payRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paystackPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      authorization_url: payRes.data.data.authorization_url,
    });

  } catch (err) {
    console.error("PAYSTACK INIT ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Unable to initiate payment" });
  }
});

/**
 * ===============================
 * SELLER MARK DELIVERY
 * ===============================
 */
router.patch(
  "/:id/mark-delivered",
  auth,
  roles("agent", "individual_seller", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const orderRes = await pool.query(
        `
        SELECT id, seller_id, status, delivery_confirmed
        FROM orders
        WHERE id = $1
        `,
        [id]
      );

      if (!orderRes.rows.length) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderRes.rows[0];

      if (
        order.seller_id !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (order.status !== "paid") {
        return res.status(400).json({
          error: "Order must be paid before delivery",
        });
      }

      if (order.delivery_confirmed) {
        return res.status(400).json({
          error: "Delivery already marked",
        });
      }

      await pool.query(
        `UPDATE orders SET delivery_confirmed = true WHERE id = $1`,
        [id]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * BUYER CONFIRMS DELIVERY
 * PATCH /api/orders/:id/confirm-delivery
 */
router.patch(
  "/:id/confirm-delivery",
  auth,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const orderId = req.params.id;

      await client.query("BEGIN");

      const orderRes = await client.query(
        `
        SELECT *
        FROM orders
        WHERE id = $1
          AND buyer_id = $2
        FOR UPDATE
        `,
        [orderId, req.user.id]
      );

      if (!orderRes.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderRes.rows[0];

      if (order.released_at) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Escrow already released"
        });
      }

      const sellerPayout =
        Number(order.amount) - Number(order.platform_fee);

      await client.query(
        `
        UPDATE orders
        SET
          delivery_confirmed = true,
          status = 'completed',
          released_at = NOW()
        WHERE id = $1
        `,
        [order.id]
      );

      await client.query(
        `
        INSERT INTO wallets (user_id, balance)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET
          balance = wallets.balance + $2,
          updated_at = NOW()
        `,
        [order.seller_id, sellerPayout]
      );

      await client.query(
        `
        UPDATE properties
        SET status = 'sold',
            sold_date = NOW()
        WHERE id = $1
        `,
        [order.property_id]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Delivery confirmed and seller paid",
        seller_payout: sellerPayout
      });

    } catch (err) {
      await client.query("ROLLBACK");
      console.error("CONFIRM DELIVERY ERROR:", err);
      res.status(500).json({ error: "Failed to confirm delivery" });
    } finally {
      client.release();
    }
  }
);

/**
 * ===============================
 * ADMIN: PENDING ESCROW ORDERS
 * GET /api/orders/admin/pending
 * ===============================
 */
router.get("/admin/pending", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(
      `
      SELECT 
        o.*,
        u.email AS buyer_email
      FROM orders o
      JOIN users u ON u.id = o.buyer_id
      WHERE o.status = 'paid'
      ORDER BY o.created_at ASC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error("ADMIN PENDING ORDERS ERROR:", err);
    res.status(500).json({ error: "Failed to load orders" });
  }
});


module.exports = router;
