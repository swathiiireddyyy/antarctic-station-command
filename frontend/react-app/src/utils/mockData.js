// ============================================================
// Mock data — used when backend is unavailable
// ============================================================

const genHistory = (base, variance, count = 288) => {
  const now = Date.now();
  const points = [];
  let val = base;
  for (let i = count; i >= 0; i--) {
    val = Math.max(0, val + (Math.random() - 0.5) * variance);
    points.push({ timestamp: new Date(now - i * 5 * 60 * 1000).toISOString(), value: parseFloat(val.toFixed(2)) });
  }
  return points;
};

export const mockSensorData = {
  maitri: {
    temperature_indoor:  { value: 18.4,  unit: '°C',   status: 'online'   },
    temperature_outdoor: { value: -22.1, unit: '°C',   status: 'online'   },
    power_generation:    { value: 85.2,  unit: 'kW',   status: 'online'   },
    power_consumption:   { value: 72.0,  unit: 'kW',   status: 'online'   },
    solar_generation:    { value: 45.6,  unit: 'kW',   status: 'online'   },
    wind_generation:     { value: 38.1,  unit: 'kW',   status: 'online'   },
    diesel_hours:        { value: 6.2,   unit: 'hrs',  status: 'online'   },
    fuel_level:          { value: 74.0,  unit: '%',    status: 'online'   },
    water_reserve:       { value: 60.0,  unit: '%',    status: 'online'   },
    battery_reserve:     { value: 68.0,  unit: '%',    status: 'online'   },
    wind_speed:          { value: 32.4,  unit: 'km/h', status: 'online'   },
  },
  bharati: {
    temperature_indoor:  { value: 20.1,  unit: '°C',   status: 'online'   },
    temperature_outdoor: { value: -18.3, unit: '°C',   status: 'online'   },
    power_generation:    { value: 110.0, unit: 'kW',   status: 'online'   },
    power_consumption:   { value: 95.5,  unit: 'kW',   status: 'online'   },
    solar_generation:    { value: 60.2,  unit: 'kW',   status: 'online'   },
    wind_generation:     { value: 48.4,  unit: 'kW',   status: 'online'   },
    diesel_hours:        { value: 4.1,   unit: 'hrs',  status: 'online'   },
    fuel_level:          { value: 32.0,  unit: '%',    status: 'warning'  },
    water_reserve:       { value: 53.0,  unit: '%',    status: 'online'   },
    battery_reserve:     { value: 55.0,  unit: '%',    status: 'online'   },
    wind_speed:          { value: 45.0,  unit: 'km/h', status: 'online'   },
  },
};

export const mockAlerts = [
  { id: 'a1', station_id: 'bharati', alert_type: 'low_fuel',    level: 'yellow', title: '🟡 WARNING: Fuel Level at BHARATI', message: 'Fuel level is at 32% — approaching critical. Please replenish.', value: 32, threshold: 35, status: 'active',       created_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: 'a2', station_id: 'maitri',  alert_type: 'high_wind',   level: 'yellow', title: '🟡 WARNING: High Wind Speed at MAITRI', message: 'Wind speed reached 78 km/h. Monitor structural integrity.', value: 78, threshold: 80, status: 'acknowledged', created_at: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 'a3', station_id: 'bharati', alert_type: 'maintenance',  level: 'green',  title: '🟢 INFO: Generator Maintenance Due', message: 'Diesel Generator #1 is due for scheduled maintenance.', value: null, threshold: null, status: 'resolved',    created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'a4', station_id: 'maitri',  alert_type: 'low_battery', level: 'yellow', title: '🟡 WARNING: Battery Reserve Low', message: 'Battery reserve at 24% — below safe operating threshold.', value: 24, threshold: 25, status: 'active',       created_at: new Date(Date.now() - 5 * 60000).toISOString() },
];

export const mockInventory = {
  maitri:  [
    { id: 'i1', name: 'Diesel Fuel',           category: 'fuel',        current_quantity: 18500, max_capacity: 25000, unit: 'litres', percentage: 74, status: 'normal'   },
    { id: 'i2', name: 'Drinking Water Reserve', category: 'water',       current_quantity: 12000, max_capacity: 20000, unit: 'litres', percentage: 60, status: 'normal'   },
    { id: 'i3', name: 'Ration Pack A',          category: 'food',        current_quantity: 450,   max_capacity: 600,   unit: 'units',  percentage: 75, status: 'normal',  expiry_date: '2027-03-01' },
    { id: 'i4', name: 'Medical Kit Basic',       category: 'medical',     current_quantity: 25,    max_capacity: 50,    unit: 'kits',   percentage: 50, status: 'normal',  expiry_date: '2026-12-31' },
    { id: 'i5', name: 'AA Batteries (pack)',     category: 'consumables', current_quantity: 80,    max_capacity: 200,   unit: 'packs',  percentage: 40, status: 'normal'   },
  ],
  bharati: [
    { id: 'i6', name: 'Diesel Fuel',            category: 'fuel',        current_quantity: 9500,  max_capacity: 30000, unit: 'litres', percentage: 32, status: 'warning'  },
    { id: 'i7', name: 'Drinking Water Reserve',  category: 'water',       current_quantity: 8000,  max_capacity: 15000, unit: 'litres', percentage: 53, status: 'normal'   },
    { id: 'i8', name: 'Ration Pack B',           category: 'food',        current_quantity: 320,   max_capacity: 500,   unit: 'units',  percentage: 64, status: 'normal',  expiry_date: '2027-01-15' },
    { id: 'i9', name: 'Medical Kit Advanced',    category: 'medical',     current_quantity: 12,    max_capacity: 30,    unit: 'kits',   percentage: 40, status: 'normal',  expiry_date: '2026-11-30' },
    { id: 'i10',name: 'Filter Cartridges',       category: 'consumables', current_quantity: 15,    max_capacity: 100,   unit: 'units',  percentage: 15, status: 'critical' },
  ],
};

export const mockEquipment = [
  { id: 'e1', station_id: 'maitri',  name: 'Diesel Generator #1',      category: 'generator',      health_score: 78, status: 'online',  next_maintenance: '2026-12-01', usage_hours: 14600 },
  { id: 'e2', station_id: 'maitri',  name: 'Solar Array Block A',       category: 'solar_panel',    health_score: 92, status: 'online',  next_maintenance: '2027-01-15', usage_hours: 9200  },
  { id: 'e3', station_id: 'maitri',  name: 'Wind Turbine #1',           category: 'wind_turbine',   health_score: 85, status: 'online',  next_maintenance: '2026-11-10', usage_hours: 11400 },
  { id: 'e4', station_id: 'maitri',  name: 'HVAC Unit - Main Building', category: 'hvac',           health_score: 70, status: 'warning', next_maintenance: '2026-10-01', usage_hours: 7200  },
  { id: 'e5', station_id: 'maitri',  name: 'Water Purification System', category: 'water_purifier', health_score: 95, status: 'online',  next_maintenance: '2027-02-01', usage_hours: 8400  },
  { id: 'e6', station_id: 'bharati', name: 'Diesel Generator #1',       category: 'generator',      health_score: 65, status: 'warning', next_maintenance: '2026-09-15', usage_hours: 24800 },
  { id: 'e7', station_id: 'bharati', name: 'Solar Array Block A',       category: 'solar_panel',    health_score: 88, status: 'online',  next_maintenance: '2027-01-01', usage_hours: 18200 },
  { id: 'e8', station_id: 'bharati', name: 'Wind Turbine #1',           category: 'wind_turbine',   health_score: 72, status: 'online',  next_maintenance: '2026-12-20', usage_hours: 19600 },
  { id: 'e9', station_id: 'bharati', name: 'HVAC Unit - Lab Block',     category: 'hvac',           health_score: 91, status: 'online',  next_maintenance: '2027-02-10', usage_hours: 12800 },
  { id: 'e10',station_id: 'bharati', name: 'Water Purification System', category: 'water_purifier', health_score: 80, status: 'online',  next_maintenance: '2026-11-25', usage_hours: 20400 },
];

export const mockPowerHistory = genHistory(80, 8);
export const mockTempHistory  = genHistory(18, 2);
