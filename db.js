require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Render Postgres
  },
});

pool.connect()
  .then(() => {
    console.log("PostgreSQL connected successfully");
  })
  .catch((err) => {
    console.error("PostgreSQL connection error:", err);
  });

module.exports = pool;
