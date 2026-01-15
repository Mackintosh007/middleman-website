const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

/**
 * REGISTER (EMAIL VERIFICATION REQUIRED)
 */
router.post("/register", async (req, res) => {
  try {
    const {
      role,
      first_name,
      last_name,
      email,
      password,
      phone_number,
      location,
      dob
    } = req.body;

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO users
       (role, first_name, last_name, email, password, phone_number, location, dob,
        email_verified, email_verification_token, email_verification_expires)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,$9,$10)`,
      [
        role,
        first_name,
        last_name,
        email,
        hashedPassword,
        phone_number,
        location,
        dob,
        emailverificationToken,
        verificationExpires
      ]
    );

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify your Middleman account",
      html: `
        <p>Please verify your email to activate your account.</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * LOGIN (EMAIL MUST BE VERIFIED)
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.email_verified && user.role !== "admin") {
      return res.status(403).json({
        error: "Please verify your email before logging in"
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        email_verified: user.email_verified
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ======================================================
 * RESEND EMAIL VERIFICATION
 * POST /api/auth/resend-verification
 * ======================================================
 */
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const userRes = await pool.query(
      `
      SELECT id, email, verified, verification_token
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];

    if (user.verified) {
      return res.status(400).json({
        error: "Account is already verified"
      });
    }

    // 🔁 Reuse existing token or generate new one
    const token =
      user.email_verification_token ||
      require("crypto").randomBytes(32).toString("hex");

    await pool.query(
      `
      UPDATE users
      SET email_verification_token = $1
      WHERE id = $2
      `,
      [token, user.id]
    );

    // 📧 SEND EMAIL (reuse your existing mailer)
    await sendVerificationEmail(user.email, token);

    res.json({
      success: true,
      message: "Verification email resent"
    });

  } catch (err) {
    console.error("RESEND VERIFICATION ERROR:", err);
    res.status(500).json({
      error: "Failed to resend verification email"
    });
  }
});


/**
 * FORGOT PASSWORD
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const userRes = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.json({ success: true });
    }

    const user = userRes.rows[0];

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashedToken, expires]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: email,
      subject: "Reset your Middleman password",
      html: `<a href="${resetUrl}">${resetUrl}</a>`
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * RESET PASSWORD
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetRes = await pool.query(
      `SELECT user_id FROM password_resets
       WHERE token = $1 AND expires_at > NOW()`,
      [hashedToken]
    );

    if (!resetRes.rows.length) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashedPassword, resetRes.rows[0].user_id]
    );

    await pool.query(
      "DELETE FROM password_resets WHERE user_id = $1",
      [resetRes.rows[0].user_id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET CURRENT USER
 */
router.get("/me", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT id, role, email, first_name, last_name, phone_number, location, email_verified FROM users WHERE id = $1",
    [req.user.id]
  );

  res.json(result.rows[0]);
});

module.exports = router;
