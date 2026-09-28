// ============================================================
// IARI Monitor — Auth Routes
// POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
// ============================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, isDbAvailable } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { logAction } = require('../utils/auditLog');

const router = express.Router();

// ---- In-memory seed users (used when DB is unavailable) ----
const SEED_USERS = [
  {
    id: 'u1', name: 'NCPOR Admin', email: 'admin@ncpor.res.in',
    password_hash: bcrypt.hashSync('Admin@1234', 10), role: 'admin', is_active: true,
  },
  {
    id: 'u2', name: 'Station Operator', email: 'operator@maitri.in',
    password_hash: bcrypt.hashSync('Operator@1234', 10), role: 'operator', is_active: true,
  },
  {
    id: 'u3', name: 'Dr. Priya Sharma', email: 'scientist@bharati.in',
    password_hash: bcrypt.hashSync('Scientist@1234', 10), role: 'scientist', is_active: true,
  },
  {
    id: 'u4', name: 'Guest User', email: 'guest@iari.in',
    password_hash: bcrypt.hashSync('Guest@1234', 10), role: 'guest', is_active: true,
  },
];

const findUserByEmail = async (email) => {
  if (isDbAvailable()) {
    const result = await query('SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email]);
    return result.rows[0] || null;
  }
  return SEED_USERS.find((u) => u.email === email && u.is_active) || null;
};

const findUserById = async (id) => {
  if (isDbAvailable()) {
    const result = await query('SELECT id, name, email, role, is_active, last_login, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
  const u = SEED_USERS.find((u) => u.id === id);
  if (!u) return null;
  const { password_hash, ...safe } = u;
  return safe;
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'iari_jwt_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '30m',
    });

    // Update last_login in DB (best-effort)
    if (isDbAvailable()) {
      await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    }

    await logAction(user.id, 'LOGIN', 'auth', null, null, req.ip);

    return res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await logAction(req.user.id, 'LOGOUT', 'auth', null, null, req.ip);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const user = await findUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    const newHash = await bcrypt.hash(newPassword, 10);
    if (isDbAvailable()) {
      await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, user.id]);
    }

    await logAction(req.user.id, 'CHANGE_PASSWORD', 'auth', null, null, req.ip);
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
