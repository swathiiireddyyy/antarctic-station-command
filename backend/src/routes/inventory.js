// ============================================================
// IARI Monitor — Inventory Routes
// ============================================================
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { query, isDbAvailable } = require('../config/db');

const router = express.Router();

// In-memory inventory fallback
const memInventory = [
  { id: 'i1', station_id: 'maitri',  name: 'Diesel Fuel',          category: 'fuel',            current_quantity: 18500, max_capacity: 25000, unit: 'litres',  expiry_date: null,         percentage: 74 },
  { id: 'i2', station_id: 'maitri',  name: 'Drinking Water Reserve',category: 'water',           current_quantity: 12000, max_capacity: 20000, unit: 'litres',  expiry_date: null,         percentage: 60 },
  { id: 'i3', station_id: 'maitri',  name: 'Ration Pack A',         category: 'food',            current_quantity: 450,   max_capacity: 600,   unit: 'units',   expiry_date: '2027-03-01', percentage: 75 },
  { id: 'i4', station_id: 'maitri',  name: 'Medical Kit Basic',     category: 'medical',         current_quantity: 25,    max_capacity: 50,    unit: 'kits',    expiry_date: '2026-12-31', percentage: 50 },
  { id: 'i5', station_id: 'maitri',  name: 'AA Batteries (pack)',   category: 'consumables',     current_quantity: 80,    max_capacity: 200,   unit: 'packs',   expiry_date: null,         percentage: 40 },
  { id: 'i6', station_id: 'bharati', name: 'Diesel Fuel',           category: 'fuel',            current_quantity: 9500,  max_capacity: 30000, unit: 'litres',  expiry_date: null,         percentage: 32 },
  { id: 'i7', station_id: 'bharati', name: 'Drinking Water Reserve',category: 'water',           current_quantity: 8000,  max_capacity: 15000, unit: 'litres',  expiry_date: null,         percentage: 53 },
  { id: 'i8', station_id: 'bharati', name: 'Ration Pack B',         category: 'food',            current_quantity: 320,   max_capacity: 500,   unit: 'units',   expiry_date: '2027-01-15', percentage: 64 },
  { id: 'i9', station_id: 'bharati', name: 'Medical Kit Advanced',  category: 'medical',         current_quantity: 12,    max_capacity: 30,    unit: 'kits',    expiry_date: '2026-11-30', percentage: 40 },
  { id: 'i10',station_id: 'bharati', name: 'Filter Cartridges',     category: 'consumables',     current_quantity: 15,    max_capacity: 100,   unit: 'units',   expiry_date: null,         percentage: 15 },
];

const withPercentage = (item) => ({
  ...item,
  percentage: Math.round((item.current_quantity / item.max_capacity) * 100),
  status: (item.current_quantity / item.max_capacity) * 100 <= 10
    ? 'critical' : (item.current_quantity / item.max_capacity) * 100 <= 20 ? 'warning' : 'normal',
  days_remaining: item.consumption_rate > 0
    ? Math.floor(item.current_quantity / item.consumption_rate) : null,
});

// GET /api/inventory/stations/:stationId
router.get('/stations/:stationId', authenticate, async (req, res) => {
  try {
    const { stationId } = req.params;
    if (isDbAvailable()) {
      const result = await query(
        'SELECT *, ROUND((current_quantity/max_capacity)*100) as percentage FROM inventory_items WHERE station_id=$1 ORDER BY category, name',
        [stationId]
      );
      return res.json({ success: true, data: result.rows.map(withPercentage) });
    }
    const data = memInventory.filter((i) => i.station_id === stationId).map(withPercentage);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch inventory.' });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', authenticate, async (req, res) => {
  try {
    if (isDbAvailable()) {
      const result = await query(
        `SELECT *, ROUND((current_quantity/max_capacity)*100) as percentage
         FROM inventory_items WHERE (current_quantity/max_capacity)*100 <= reorder_threshold
         ORDER BY (current_quantity/max_capacity) ASC`
      );
      return res.json({ success: true, data: result.rows.map(withPercentage) });
    }
    const data = memInventory.filter((i) => i.percentage <= 20).map(withPercentage);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch low-stock items.' });
  }
});

// PUT /api/inventory/:id
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { current_quantity } = req.body;
    if (current_quantity === undefined) {
      return res.status(400).json({ success: false, message: 'current_quantity is required.' });
    }
    if (isDbAvailable()) {
      await query('UPDATE inventory_items SET current_quantity=$1, last_updated=NOW() WHERE id=$2', [current_quantity, id]);
    } else {
      const item = memInventory.find((i) => i.id === id);
      if (item) item.current_quantity = current_quantity;
    }
    return res.json({ success: true, message: 'Inventory updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update inventory.' });
  }
});

module.exports = router;
