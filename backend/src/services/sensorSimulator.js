// ============================================================
// IARI Monitor — Sensor Data Simulator
// Generates realistic Antarctic station sensor data
// and broadcasts via Socket.io every 5 seconds
// ============================================================
const { emitSensorUpdate } = require('../config/socket');
const { emitAlert } = require('../config/socket');
const { v4: uuidv4 } = require('uuid');

// In-memory stores
const sensorHistory = { maitri: {}, bharati: {} };
const alertStore = [];

// ---- Initial realistic baseline values ----
const baselineValues = {
  maitri: {
    temperature_indoor: 18,
    temperature_outdoor: -22,
    power_generation: 85,
    power_consumption: 72,
    solar_generation: 45,
    wind_generation: 38,
    diesel_hours: 6,
    fuel_level: 74,
    water_reserve: 60,
    battery_reserve: 68,
    wind_speed: 32,
  },
  bharati: {
    temperature_indoor: 20,
    temperature_outdoor: -18,
    power_generation: 110,
    power_consumption: 95,
    solar_generation: 60,
    wind_generation: 48,
    diesel_hours: 4,
    fuel_level: 32,      // Low fuel — triggers yellow alert
    water_reserve: 53,
    battery_reserve: 55,
    wind_speed: 45,
  },
};

// Sensor metadata: { unit, min, max, warningMin, warningMax, criticalMin, criticalMax }
const sensorMeta = {
  temperature_indoor:  { unit: '°C',   min: 5,   max: 28,   warnMin: 10,  warnMax: 25, critMin: 5,   critMax: 30 },
  temperature_outdoor: { unit: '°C',   min: -45, max: -5,   warnMin: -40, warnMax: -8, critMin: -45, critMax: -5 },
  power_generation:    { unit: 'kW',   min: 10,  max: 150,  warnMin: 20,  warnMax: 140, critMin: 10, critMax: 148 },
  power_consumption:   { unit: 'kW',   min: 30,  max: 130,  warnMin: 40,  warnMax: 120, critMin: 30, critMax: 128 },
  solar_generation:    { unit: 'kW',   min: 0,   max: 80,   warnMin: 5,   warnMax: 75,  critMin: 0,  critMax: 78 },
  wind_generation:     { unit: 'kW',   min: 0,   max: 65,   warnMin: 5,   warnMax: 60,  critMin: 0,  critMax: 63 },
  diesel_hours:        { unit: 'hrs',  min: 0,   max: 24,   warnMin: 0,   warnMax: 20,  critMin: 0,  critMax: 23 },
  fuel_level:          { unit: '%',    min: 0,   max: 100,  warnMin: 20,  warnMax: 95,  critMin: 10, critMax: 98 },
  water_reserve:       { unit: '%',    min: 0,   max: 100,  warnMin: 30,  warnMax: 95,  critMin: 15, critMax: 98 },
  battery_reserve:     { unit: '%',    min: 0,   max: 100,  warnMin: 25,  warnMax: 95,  critMin: 10, critMax: 98 },
  wind_speed:          { unit: 'km/h', min: 0,   max: 150,  warnMin: 5,   warnMax: 80,  critMin: 0,  critMax: 120 },
};

// Track last alert time per sensor to avoid spam
const lastAlertTime = {};

/**
 * Clamp a value between min and max
 */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/**
 * Add a small random drift to a value
 */
const drift = (val, maxChange = 1.5) =>
  val + (Math.random() - 0.5) * 2 * maxChange;

/**
 * Get sensor status based on value and thresholds
 */
const getSensorStatus = (type, value) => {
  const meta = sensorMeta[type];
  if (!meta) return 'online';
  if (value <= meta.critMin || value >= meta.critMax) return 'critical';
  if (value <= meta.warnMin || value >= meta.warnMax) return 'warning';
  return 'online';
};

/**
 * Generate or update sensor readings for a station
 */
const generateSensorData = (stationId) => {
  const baseline = baselineValues[stationId];
  const sensors = {};

  for (const [type, meta] of Object.entries(sensorMeta)) {
    const prev = baseline[type];
    let maxDrift;
    // Different drift rates for different sensor types
    if (type === 'fuel_level' || type === 'water_reserve') maxDrift = 0.05;
    else if (type === 'diesel_hours') maxDrift = 0.02;
    else if (type === 'wind_speed') maxDrift = 4;
    else maxDrift = 1.5;

    const newVal = clamp(drift(prev, maxDrift), meta.min, meta.max);
    baseline[type] = newVal; // update baseline for next iteration

    sensors[type] = {
      value: parseFloat(newVal.toFixed(2)),
      unit: meta.unit,
      status: getSensorStatus(type, newVal),
    };
  }

  // Compute health score (weighted average of sensor statuses)
  const statusWeights = { online: 100, warning: 60, critical: 20 };
  const scores = Object.values(sensors).map((s) => statusWeights[s.status] || 100);
  const healthScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const systemStatus =
    Object.values(sensors).some((s) => s.status === 'critical')
      ? 'critical'
      : Object.values(sensors).some((s) => s.status === 'warning')
      ? 'warning'
      : 'online';

  return {
    stationId,
    timestamp: new Date().toISOString(),
    sensors,
    health_score: healthScore,
    system_status: systemStatus,
  };
};

/**
 * Check sensor values against thresholds and fire alerts
 */
const checkAndFireAlerts = (stationId, sensors) => {
  const alertThresholds = [
    { type: 'fuel_level',      warnThreshold: 20, critThreshold: 10,  label: 'Fuel Level',      alertType: 'low_fuel' },
    { type: 'water_reserve',   warnThreshold: 30, critThreshold: 15,  label: 'Water Reserve',    alertType: 'low_water' },
    { type: 'battery_reserve', warnThreshold: 25, critThreshold: 10,  label: 'Battery Reserve',  alertType: 'low_battery' },
  ];

  for (const cfg of alertThresholds) {
    const sensor = sensors[cfg.type];
    if (!sensor) continue;
    const val = sensor.value;
    const alertKey = `${stationId}_${cfg.type}`;
    const now = Date.now();

    // Throttle: only fire once every 5 minutes per sensor per station
    if (lastAlertTime[alertKey] && now - lastAlertTime[alertKey] < 5 * 60 * 1000) continue;

    let level = null;
    let title = '';
    let message = '';

    if (val <= cfg.critThreshold) {
      level = 'red';
      title = `🔴 CRITICAL: ${cfg.label} at ${stationId.toUpperCase()}`;
      message = `${cfg.label} has dropped to ${val.toFixed(1)}% — CRITICAL level! Immediate action required.`;
    } else if (val <= cfg.warnThreshold) {
      level = 'yellow';
      title = `🟡 WARNING: ${cfg.label} at ${stationId.toUpperCase()}`;
      message = `${cfg.label} is at ${val.toFixed(1)}% — approaching critical level. Please replenish soon.`;
    }

    if (level) {
      lastAlertTime[alertKey] = now;
      const alert = {
        id: uuidv4(),
        station_id: stationId,
        alert_type: cfg.alertType,
        level,
        title,
        message,
        value: val,
        threshold: level === 'red' ? cfg.critThreshold : cfg.warnThreshold,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      alertStore.unshift(alert);
      if (alertStore.length > 200) alertStore.pop(); // keep max 200
      emitAlert(alert);
    }
  }
};

/**
 * Pre-generate 24 hours of historical data on startup
 */
const generateHistory = () => {
  const now = Date.now();
  const points = 288; // 24h × 12 points/hour (every 5 min)

  for (const stationId of ['maitri', 'bharati']) {
    // Reset baseline to slightly different starting point for history
    const histBaseline = { ...baselineValues[stationId] };

    for (const type of Object.keys(sensorMeta)) {
      sensorHistory[stationId][type] = [];
    }

    for (let i = points; i >= 0; i--) {
      const timestamp = new Date(now - i * 5 * 60 * 1000).toISOString();
      for (const [type, meta] of Object.entries(sensorMeta)) {
        let maxDrift = type === 'fuel_level' || type === 'water_reserve' ? 0.03 : 1.2;
        histBaseline[type] = clamp(drift(histBaseline[type], maxDrift), meta.min, meta.max);
        sensorHistory[stationId][type].push({
          timestamp,
          value: parseFloat(histBaseline[type].toFixed(2)),
          unit: meta.unit,
        });
      }
    }
  }
  console.log('📊 24h sensor history pre-generated for both stations');
};

/**
 * Get historical data for a sensor type
 */
const getSensorHistory = (stationId, sensorType, hours = 24) => {
  const history = sensorHistory[stationId]?.[sensorType] || [];
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return history.filter((p) => p.timestamp >= cutoff);
};

/**
 * Get all current sensor readings for a station
 */
const getLatestReadings = (stationId) => {
  const baseline = baselineValues[stationId];
  const sensors = {};
  for (const [type, meta] of Object.entries(sensorMeta)) {
    sensors[type] = {
      value: parseFloat(baseline[type].toFixed(2)),
      unit: meta.unit,
      status: getSensorStatus(type, baseline[type]),
    };
  }
  return sensors;
};

/**
 * Get in-memory alert store
 */
const getAlerts = () => alertStore;

/**
 * Start the simulator loop
 */
const startSimulator = () => {
  generateHistory();

  setInterval(() => {
    for (const stationId of ['maitri', 'bharati']) {
      const data = generateSensorData(stationId);

      // Append new readings to history (keep last 1000 per sensor)
      for (const [type, reading] of Object.entries(data.sensors)) {
        if (!sensorHistory[stationId][type]) sensorHistory[stationId][type] = [];
        sensorHistory[stationId][type].push({ timestamp: data.timestamp, value: reading.value, unit: reading.unit });
        if (sensorHistory[stationId][type].length > 1000) sensorHistory[stationId][type].shift();
      }

      checkAndFireAlerts(stationId, data.sensors);
      emitSensorUpdate(data);
    }
  }, 5000);

  console.log('🛰️  Sensor simulator started — broadcasting every 5 seconds');
};

module.exports = { startSimulator, getSensorHistory, getLatestReadings, getAlerts, sensorMeta };
