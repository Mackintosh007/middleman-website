const express = require("express");
const crypto = require("crypto");
const pool = require("../db");

const router = express.Router();

router.post("/paystack", async (req, res) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  if (req.body.event === "charge.success") {
    const orderId = req.body.data.metadata.order_id;

    await pool.query(
      `UPDATE orders
       SET status = 'funds_held'
       WHERE id = $1`,
      [orderId]
    );
  }

  res.sendStatus(200);
});

module.exports = router;
