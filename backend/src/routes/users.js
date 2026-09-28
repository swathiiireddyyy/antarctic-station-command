// ============================================================
// IARI Monitor — Users Routes (Admin only)
// ============================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { query, isDbAvailable } = require('../config/db');
const { logAction } = require('../utils/auditLog');

const router = express.Router();

// In-memory users store (mirrors seed users, used without DB)
const memUsers = [
  { id: 'u1', name: 'NCPOR Admin',     email: 'admin@ncpor.res.in',    role: 'admin',     is_active: true, last_login: null, created_at: new Date().toISOString() },
  { id: 'u2', name: 'Station Operator',email: 'operator@maitri.in',    role: 'operator',  is_active: true, last_login: null, created_at: new Date().toISOString() },
  { id: 'u3', name: 'Dr. Priya Sharma',email: 'scientist@bharati.in',  role: 'scientist', is_active: true, last_login: null, created_at: new Date().toISOString() },
  { id: 'u4', name: 'Guest User',      email: 'guest@iari.in',         role: 'guest',     is_active: true, last_login: null, created_at: new Date().toISOString() },
];

// GET /api/users
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (isDbAvailable()) {
      const result = await query('SELECT id, name, email, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC');
      return res.json({ success: true, data: result.rows });
    }
    return res.json({ success: true, data: memUsers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// POST /api/users
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'name, email, password, role are required.' });
    }
    const validRoles = ['admin', 'operator', 'scientist', 'guest'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${validRoles.join(', ')}` });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = { id: uuidv4(), name, email: email.toLowerCase(), role, is_active: true, created_at: new Date().toISOString() };

    if (isDbAvailable()) {
      await query(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5)',
        [newUser.id, name, newUser.email, hash, role]
      );
    } else {
      memUsers.push(newUser);
    }

    await logAction(req.user.id, 'CREATE_USER', 'users', newUser.id, { email, role }, req.ip);
    const { password_hash, ...safeUser } = newUser;
    return res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Email already exists.' });
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, is_active } = req.body;

    if (isDbAvailable()) {
      await query(
        'UPDATE users SET name=COALESCE($1,name), role=COALESCE($2,role), is_active=COALESCE($3,is_active), updated_at=NOW() WHERE id=$4',
        [name, role, is_active, id]
      );
    } else {
      const u = memUsers.find((u) => u.id === id);
      if (u) { if (name) u.name = name; if (role) u.role = role; if (is_active !== undefined) u.is_active = is_active; }
    }

    await logAction(req.user.id, 'UPDATE_USER', 'users', id, { name, role, is_active }, req.ip);
    return res.json({ success: true, message: 'User updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
});

// DELETE /api/users/:id (soft delete)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbAvailable()) {
      await query('UPDATE users SET is_active=FALSE, updated_at=NOW() WHERE id=$1', [id]);
    } else {
      const u = memUsers.find((u) => u.id === id);
      if (u) u.is_active = false;
    }
    await logAction(req.user.id, 'DEACTIVATE_USER', 'users', id, null, req.ip);
    return res.json({ success: true, message: 'User deactivated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to deactivate user.' });
  }
});

// GET /api/users/audit-logs
router.get('/audit-logs', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (isDbAvailable()) {
      const result = await query(
        `SELECT al.*, u.name as user_name, u.email as user_email
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC LIMIT 100`
      );
      return res.json({ success: true, data: result.rows });
    }
    return res.json({ success: true, data: [], message: 'Audit logs require database connection.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

module.exports = router;
