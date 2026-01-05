const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

/**
 * REGISTER USER
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

    const user = await pool.query(
      `INSERT INTO users
       (role, first_name, last_name, email, password, phone_number, location, dob, sex)
       VALUES ('customer',$1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, role, email`,
      [
        first_name,
        last_name,
        email,
        hashedPassword,
        phone_number,
        location,
        dob,
        sex
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

    if (!result.rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
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
        verified: user.verified
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET CURRENT USER PROFILE
 */
router.get("/me", auth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, first_name, last_name, email, phone_number, location, role, verified
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
 * ===============================
 * ADMIN: GET ALL USERS
 * ===============================
 */
router.get("/", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const result = await pool.query(
    `SELECT id, first_name, last_name, email, role, verified
     FROM users
     ORDER BY created_at DESC`
  );

  res.json(result.rows);
});

/**
 * ===============================
 * ADMIN: VERIFY / UNVERIFY USER
 * ===============================
 */
router.patch("/:id/verify", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { verified } = req.body;

  const result = await pool.query(
    `UPDATE users
     SET verified = $1
     WHERE id = $2
     RETURNING verified`,
    [verified, req.params.id]
  );

  res.json(result.rows[0]);
});

module.exports = router;
