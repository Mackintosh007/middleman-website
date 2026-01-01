const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

/**
 * Generate 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * REQUEST OTP
 */
router.post("/request", auth, async (req, res) => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // delete existing OTPs
    await pool.query(
      "DELETE FROM phone_otps WHERE user_id = $1",
      [req.user.id]
    );

    await pool.query(
      `INSERT INTO phone_otps (user_id, otp, expires_at)
       VALUES ($1, $2, $3)`,
      [req.user.id, otp, expiresAt]
    );

    /**
     * DEV MODE:
     * Return OTP in response
     * (In production → send via SMS)
     */
    res.json({
      message: "OTP sent to phone number",
      otp // ⚠️ remove when SMS is added
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * VERIFY OTP
 */
router.post("/verify", auth, async (req, res) => {
  try {
    const { otp } = req.body;

    const result = await pool.query(
      `SELECT * FROM phone_otps
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: "No OTP found" });
    }

    const record = result.rows[0];

    if (record.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // mark phone verified
    await pool.query(
      "UPDATE users SET phone_verified = true WHERE id = $1",
      [req.user.id]
    );

    // cleanup
    await pool.query(
      "DELETE FROM phone_otps WHERE user_id = $1",
      [req.user.id]
    );

    res.json({ message: "Phone number verified" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
