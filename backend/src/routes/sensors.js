// ============================================================
// IARI Monitor — Sensor Routes
// GET /api/stations/:stationId/sensors
// GET /api/stations/:stationId/sensors/:type/history
// GET /api/stations/:stationId/overview
// ============================================================
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getLatestReadings, getSensorHistory } = require('../services/sensorSimulator');

const router = express.Router({ mergeParams: true });

// GET /api/stations/:stationId/sensors — latest readings for all sensor types
router.get('/', authenticate, (req, res) => {
  const { stationId } = req.params;
  const validStations = ['maitri', 'bharati'];
  if (!validStations.includes(stationId)) {
    return res.status(404).json({ success: false, message: 'Station not found.' });
  }
  const sensors = getLatestReadings(stationId);
  return res.json({ success: true, stationId, sensors, timestamp: new Date().toISOString() });
});

// GET /api/stations/:stationId/sensors/:type/history?hours=24
router.get('/:type/history', authenticate, (req, res) => {
  const { stationId, type } = req.params;
  const hours = parseInt(req.query.hours) || 24;
  const history = getSensorHistory(stationId, type, hours);
  return res.json({ success: true, stationId, sensorType: type, hours, data: history });
});

// GET /api/stations/:stationId/overview — station health summary
router.get('/overview', authenticate, (req, res) => {
  const { stationId } = req.params;
  const validStations = ['maitri', 'bharati'];
  if (!validStations.includes(stationId)) {
    return res.status(404).json({ success: false, message: 'Station not found.' });
  }
  const sensors = getLatestReadings(stationId);
  const statusWeights = { online: 100, warning: 60, critical: 20 };
  const scores = Object.values(sensors).map((s) => statusWeights[s.status] || 100);
  const healthScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const systemStatus = Object.values(sensors).some((s) => s.status === 'critical')
    ? 'critical'
    : Object.values(sensors).some((s) => s.status === 'warning')
    ? 'warning'
    : 'online';

  return res.json({
    success: true,
    stationId,
    healthScore,
    systemStatus,
    sensors,
    lastUpdated: new Date().toISOString(),
  });
});

module.exports = router;
