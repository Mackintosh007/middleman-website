const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const auditLog = require("../utils/auditLog");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

/**
 * REGISTER USER (EMAIL VERIFICATION REQUIRED)
 */
router.post("/register", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone_number,
      location,
      dob,
      sex
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
       (role, first_name, last_name, email, password, phone_number, location, dob, sex,
        email_verified, email_verification_token, email_verification_expires)
       VALUES ('customer',$1,$2,$3,$4,$5,$6,$7,$8,false,$9,$10)`,
      [
        first_name,
        last_name,
        email,
        hashedPassword,
        phone_number,
        location,
        dob,
        sex,
        verificationToken,
        verificationExpires
      ]
    );

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify your Middleman account",
      html: `
        <h3>Welcome to Middleman</h3>
        <p>Please verify your email to activate your account.</p>
        <a href="${verifyUrl}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to verify your account."
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
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

    if (!result.rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
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
        verified: user.verified,
        email_verified: user.email_verified
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * VERIFY EMAIL
 */
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    const result = await pool.query(
      `SELECT id FROM users
       WHERE email_verification_token = $1
       AND email_verification_expires > NOW()`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    await pool.query(
      `UPDATE users
       SET email_verified = true,
           email_verification_token = NULL,
           email_verification_expires = NULL
       WHERE id = $1`,
      [result.rows[0].id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🔁 RESEND EMAIL VERIFICATION (ADDED – SAFE)
 */
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    const userRes = await pool.query(
      `SELECT id, email_verified FROM users WHERE email = $1`,
      [email]
    );

    // Always return success (prevents email enumeration)
    if (!userRes.rows.length) {
      return res.json({ success: true });
    }

    const user = userRes.rows[0];

    if (user.email_verified) {
      return res.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET email_verification_token = $1,
           email_verification_expires = $2
       WHERE id = $3`,
      [token, expires, user.id]
    );

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Verify your Middleman account",
      html: `
        <p>Please verify your email to continue:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>This link expires in 24 hours.</p>
      `
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET CURRENT USER PROFILE
 */
router.get("/me", auth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, first_name, last_name, email, phone_number,
            location, role, verified, email_verified
     FROM users
     WHERE id = $1`,
    [req.user.id]
  );

  res.json(result.rows[0]);
});

/**
 * UPDATE PROFILE
 */
router.patch("/me", auth, async (req, res) => {
  const { first_name, last_name, phone_number, location } = req.body;

  const result = await pool.query(
    `
    UPDATE users SET
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      phone_number = COALESCE($3, phone_number),
      location = COALESCE($4, location)
    WHERE id = $5
    RETURNING first_name, last_name, phone_number, location
    `,
    [first_name, last_name, phone_number, location, req.user.id]
  );

  res.json(result.rows[0]);
});

/**
 * PUBLIC SELLER PROFILE
 */
router.get("/seller/:id", async (req, res) => {
  try {
    const sellerId = req.params.id;

    const userRes = await pool.query(
      `SELECT id, first_name, last_name, role, location, verified
       FROM users WHERE id = $1`,
      [sellerId]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({ error: "Seller not found" });
    }

    const listingsRes = await pool.query(
      `SELECT id, title, price, location, property_type, status
       FROM properties
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [sellerId]
    );

    res.json({
      seller: userRes.rows[0],
      listings: listingsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN: GET ALL USERS
 */
router.get("/", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const result = await pool.query(
    `SELECT id, first_name, last_name, email, role, verified, email_verified
     FROM users
     ORDER BY created_at DESC`
  );

  res.json(result.rows);
});

/**
 * ADMIN: VERIFY / UNVERIFY USER
 */
router.patch("/:id/verify", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const { verified } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET verified = $1
       WHERE id = $2
       RETURNING verified`,
      [verified, req.params.id]
    );

    await auditLog({
      adminId: req.user.id,
      action: verified ? "verify_user" : "unverify_user",
      entityType: "user",
      entityId: req.params.id,
      metadata: { verified }
    });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
