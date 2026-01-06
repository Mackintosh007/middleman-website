const pool = require("../db");

async function auditLog({
  adminId,
  action,
  entityType,
  entityId = null,
  metadata = {}
}) {
  try {
    await pool.query(
      `
      INSERT INTO admin_audit_logs
      (admin_id, action, entity_type, entity_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [adminId, action, entityType, entityId, metadata]
    );
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err.message);
  }
}

module.exports = auditLog;
