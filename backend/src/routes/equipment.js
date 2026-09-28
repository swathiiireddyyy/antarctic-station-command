// ============================================================
// IARI Monitor — Equipment Routes
// ============================================================
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { query, isDbAvailable } = require('../config/db');

const router = express.Router();

const memEquipment = [
  { id: 'e1', station_id: 'maitri',  name: 'Diesel Generator #1',       category: 'generator',      installed_date: '2018-01-15', last_maintenance: '2026-06-01', next_maintenance: '2026-12-01', usage_hours: 14600, health_score: 78, status: 'online'   },
  { id: 'e2', station_id: 'maitri',  name: 'Solar Array Block A',        category: 'solar_panel',    installed_date: '2020-06-01', last_maintenance: '2026-07-15', next_maintenance: '2027-01-15', usage_hours: 9200,  health_score: 92, status: 'online'   },
  { id: 'e3', station_id: 'maitri',  name: 'Wind Turbine #1',            category: 'wind_turbine',   installed_date: '2019-03-20', last_maintenance: '2026-05-10', next_maintenance: '2026-11-10', usage_hours: 11400, health_score: 85, status: 'online'   },
  { id: 'e4', station_id: 'maitri',  name: 'HVAC Unit - Main Building',  category: 'hvac',           installed_date: '2021-09-10', last_maintenance: '2026-04-01', next_maintenance: '2026-10-01', usage_hours: 7200,  health_score: 70, status: 'warning'  },
  { id: 'e5', station_id: 'maitri',  name: 'Water Purification System',  category: 'water_purifier', installed_date: '2020-11-05', last_maintenance: '2026-08-01', next_maintenance: '2027-02-01', usage_hours: 8400,  health_score: 95, status: 'online'   },
  { id: 'e6', station_id: 'bharati', name: 'Diesel Generator #1',        category: 'generator',      installed_date: '2013-02-01', last_maintenance: '2026-03-15', next_maintenance: '2026-09-15', usage_hours: 24800, health_score: 65, status: 'warning'  },
  { id: 'e7', station_id: 'bharati', name: 'Solar Array Block A',        category: 'solar_panel',    installed_date: '2015-08-15', last_maintenance: '2026-07-01', next_maintenance: '2027-01-01', usage_hours: 18200, health_score: 88, status: 'online'   },
  { id: 'e8', station_id: 'bharati', name: 'Wind Turbine #1',            category: 'wind_turbine',   installed_date: '2016-04-12', last_maintenance: '2026-06-20', next_maintenance: '2026-12-20', usage_hours: 19600, health_score: 72, status: 'online'   },
  { id: 'e9', station_id: 'bharati', name: 'HVAC Unit - Lab Block',      category: 'hvac',           installed_date: '2018-07-22', last_maintenance: '2026-08-10', next_maintenance: '2027-02-10', usage_hours: 12800, health_score: 91, status: 'online'   },
  { id: 'e10',station_id: 'bharati', name: 'Water Purification System',  category: 'water_purifier', installed_date: '2014-10-30', last_maintenance: '2026-05-25', next_maintenance: '2026-11-25', usage_hours: 20400, health_score: 80, status: 'online'   },
];

// GET /api/equipment/stations/:stationId
router.get('/stations/:stationId', authenticate, async (req, res) => {
  try {
    const { stationId } = req.params;
    if (isDbAvailable()) {
      const result = await query('SELECT * FROM equipment WHERE station_id=$1 ORDER BY category, name', [stationId]);
      return res.json({ success: true, data: result.rows });
    }
    return res.json({ success: true, data: memEquipment.filter((e) => e.station_id === stationId) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch equipment.' });
  }
});

// GET /api/equipment (all stations)
router.get('/', authenticate, async (req, res) => {
  try {
    if (isDbAvailable()) {
      const result = await query('SELECT * FROM equipment ORDER BY station_id, category');
      return res.json({ success: true, data: result.rows });
    }
    return res.json({ success: true, data: memEquipment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch equipment.' });
  }
});

// PUT /api/equipment/:id/health
router.put('/:id/health', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { health_score, status, usage_hours } = req.body;
    if (isDbAvailable()) {
      await query(
        'UPDATE equipment SET health_score=COALESCE($1,health_score), status=COALESCE($2,status), usage_hours=COALESCE($3,usage_hours), updated_at=NOW() WHERE id=$4',
        [health_score, status, usage_hours, id]
      );
    } else {
      const eq = memEquipment.find((e) => e.id === id);
      if (eq) { if (health_score !== undefined) eq.health_score = health_score; if (status) eq.status = status; }
    }
    return res.json({ success: true, message: 'Equipment updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update equipment.' });
  }
});

module.exports = router;
