// ============================================================
// IARI Monitor — Alerts Routes
// Full CRUD + acknowledge/resolve workflow
// ============================================================
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { query, isDbAvailable } = require('../config/db');
const { getAlerts } = require('../services/sensorSimulator');
const { logAction } = require('../utils/auditLog');

const router = express.Router();

const getAlertStore = () => getAlerts(); // in-memory fallback

// GET /api/alerts
router.get('/', authenticate, async (req, res) => {
  try {
    const { station, level, status, limit = 50, offset = 0 } = req.query;

    if (isDbAvailable()) {
      let sql = 'SELECT * FROM alerts WHERE 1=1';
      const params = [];
      if (station) { params.push(station); sql += ` AND station_id = $${params.length}`; }
      if (level)   { params.push(level);   sql += ` AND level = $${params.length}`; }
      if (status)  { params.push(status);  sql += ` AND status = $${params.length}`; }
      params.push(parseInt(limit), parseInt(offset));
      sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
      const result = await query(sql, params);
      return res.json({ success: true, data: result.rows, total: result.rows.length });
    }

    // In-memory fallback
    let alerts = getAlertStore();
    if (station) alerts = alerts.filter((a) => a.station_id === station);
    if (level)   alerts = alerts.filter((a) => a.level === level);
    if (status)  alerts = alerts.filter((a) => a.status === status);
    return res.json({ success: true, data: alerts.slice(offset, offset + limit), total: alerts.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch alerts.' });
  }
});

// GET /api/alerts/stats
router.get('/stats', authenticate, async (req, res) => {
  const alerts = getAlertStore();
  return res.json({
    success: true,
    stats: {
      total:        alerts.length,
      active:       alerts.filter((a) => a.status === 'active').length,
      acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
      resolved:     alerts.filter((a) => a.status === 'resolved').length,
      red:          alerts.filter((a) => a.level === 'red').length,
      yellow:       alerts.filter((a) => a.level === 'yellow').length,
      green:        alerts.filter((a) => a.level === 'green').length,
    },
  });
});

// POST /api/alerts
router.post('/', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { station_id, alert_type, level, title, message, value, threshold } = req.body;
    if (!station_id || !level || !title || !message) {
      return res.status(400).json({ success: false, message: 'station_id, level, title, message are required.' });
    }
    const alert = {
      id: uuidv4(), station_id, alert_type: alert_type || 'manual', level, title, message,
      value: value || null, threshold: threshold || null, status: 'active',
      created_at: new Date().toISOString(),
    };

    if (isDbAvailable()) {
      await query(
        `INSERT INTO alerts (id, station_id, alert_type, level, title, message, value, threshold)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [alert.id, station_id, alert.alert_type, level, title, message, value, threshold]
      );
    } else {
      getAlertStore().unshift(alert);
    }

    await logAction(req.user.id, 'CREATE_ALERT', 'alerts', alert.id, { level, title }, req.ip);
    return res.status(201).json({ success: true, data: alert });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create alert.' });
  }
});

// PUT /api/alerts/:id/acknowledge
router.put('/:id/acknowledge', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();

    if (isDbAvailable()) {
      await query(
        `UPDATE alerts SET status='acknowledged', acknowledged_by=$1, acknowledged_at=$2, updated_at=NOW() WHERE id=$3`,
        [req.user.id, now, id]
      );
    } else {
      const alert = getAlertStore().find((a) => a.id === id);
      if (alert) { alert.status = 'acknowledged'; alert.acknowledged_at = now; alert.acknowledged_by = req.user.id; }
    }

    await logAction(req.user.id, 'ACKNOWLEDGE_ALERT', 'alerts', id, null, req.ip);
    return res.json({ success: true, message: 'Alert acknowledged.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to acknowledge alert.' });
  }
});

// PUT /api/alerts/:id/resolve
router.put('/:id/resolve', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action_taken } = req.body;
    const now = new Date().toISOString();

    if (isDbAvailable()) {
      await query(
        `UPDATE alerts SET status='resolved', resolved_by=$1, resolved_at=$2, action_taken=$3, updated_at=NOW() WHERE id=$4`,
        [req.user.id, now, action_taken || '', id]
      );
    } else {
      const alert = getAlertStore().find((a) => a.id === id);
      if (alert) { alert.status = 'resolved'; alert.resolved_at = now; alert.action_taken = action_taken; }
    }

    await logAction(req.user.id, 'RESOLVE_ALERT', 'alerts', id, { action_taken }, req.ip);
    return res.json({ success: true, message: 'Alert resolved.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to resolve alert.' });
  }
});

module.exports = router;
