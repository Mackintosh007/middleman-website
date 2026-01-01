const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

/**
 * REGISTER
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

    // check if user exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await pool.query(
      `INSERT INTO users
       (role, first_name, last_name, email, password, phone_number, location, dob)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, role, email`,
      [
        role,
        first_name,
        last_name,
        email,
        hashedPassword,
        phone_number,
        location,
        dob
      ]
    );

    res.status(201).json(user.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * LOGIN
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

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
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

    // Always return success (security best practice)
    if (userRes.rows.length === 0) {
      return res.json({ success: true });
    }

    const user = userRes.rows[0];

    // generate secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashedToken, expires]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: email,
      subject: "Reset your Middleman password",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour.</p>
      `,
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

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetRes = await pool.query(
      `
      SELECT pr.user_id
      FROM password_resets pr
      WHERE pr.token = $1 AND pr.expires_at > NOW()
      `,
      [hashedToken]
    );

    if (resetRes.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const userId = resetRes.rows[0].user_id;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashedPassword, userId]
    );

    await pool.query(
      "DELETE FROM password_resets WHERE user_id = $1",
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/**
 * GET CURRENT USER (AUTH CHECK)
 */
router.get("/me", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, role, email, first_name, last_name, phone_number, location FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
