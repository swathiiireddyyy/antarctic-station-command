// ============================================================
// IARI Monitor — Audit Log Utility
// ============================================================
const { query } = require('../config/db');

/**
 * Log an admin/user action to audit_logs table (or console if DB unavailable)
 */
const logAction = async (userId, action, resource = null, resourceId = null, details = null, ipAddress = null) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, resource, resourceId, details ? JSON.stringify(details) : null, ipAddress]
    );
  } catch (err) {
    // Silently log to console when DB is unavailable
    console.log(`[AUDIT] user=${userId} action=${action} resource=${resource}/${resourceId}`);
  }
};

module.exports = { logAction };
