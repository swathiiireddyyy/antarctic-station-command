// ============================================================
// Utility functions for formatting and status logic
// ============================================================

export const formatTimestamp = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
};

export const formatValue = (value, unit) => {
  if (value === null || value === undefined) return '—';
  const num = parseFloat(value);
  return `${isNaN(num) ? value : num.toFixed(unit === '%' || unit === 'hrs' ? 1 : 1)} ${unit || ''}`.trim();
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'online':   return 'text-emerald-400';
    case 'warning':  return 'text-amber-400';
    case 'critical': return 'text-red-400';
    default:         return 'text-slate-400';
  }
};

export const getStatusBg = (status) => {
  switch (status) {
    case 'online':   return 'bg-emerald-900/40 border-emerald-700/50';
    case 'warning':  return 'bg-amber-900/40 border-amber-700/50';
    case 'critical': return 'bg-red-900/40 border-red-700/50';
    default:         return 'bg-slate-800/60 border-slate-700/50';
  }
};

export const getAlertLevelColor = (level) => {
  switch (level) {
    case 'red':    return 'text-red-400 bg-red-900/30 border-red-700/50';
    case 'yellow': return 'text-amber-400 bg-amber-900/30 border-amber-700/50';
    case 'green':  return 'text-emerald-400 bg-emerald-900/30 border-emerald-700/50';
    default:       return 'text-slate-400 bg-slate-800/30 border-slate-700/50';
  }
};

export const getAlertLevelDot = (level) => {
  switch (level) {
    case 'red':    return 'bg-red-500';
    case 'yellow': return 'bg-amber-500';
    case 'green':  return 'bg-emerald-500';
    default:       return 'bg-slate-500';
  }
};

export const getHealthColor = (score) => {
  if (score >= 80) return '#10b981'; // emerald
  if (score >= 60) return '#f59e0b'; // amber
  return '#ef4444';                   // red
};

export const getInventoryStatusColor = (pct) => {
  if (pct <= 10) return 'bg-red-500';
  if (pct <= 20) return 'bg-amber-500';
  if (pct <= 50) return 'bg-cyan-500';
  return 'bg-emerald-500';
};

export const getCategoryIcon = (category) => {
  const icons = {
    generator:     '⚡',
    solar_panel:   '☀️',
    wind_turbine:  '💨',
    hvac:          '❄️',
    water_purifier:'💧',
    fuel:          '⛽',
    water:         '🚰',
    food:          '🍱',
    medical:       '🏥',
    consumables:   '🔋',
    equipment_parts:'🔧',
  };
  return icons[category] || '📦';
};

export const getSystemStatusBadge = (status) => {
  switch (status) {
    case 'online':   return { label: '✅ Online',   className: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' };
    case 'warning':  return { label: '⚠️ Warning',  className: 'bg-amber-900/60 text-amber-300 border border-amber-700/50' };
    case 'critical': return { label: '❌ Critical', className: 'bg-red-900/60 text-red-300 border border-red-700/50' };
    default:         return { label: '— Unknown',   className: 'bg-slate-800 text-slate-400 border border-slate-700' };
  }
};

export const sensorLabels = {
  temperature_indoor:  { label: 'Indoor Temp',    icon: '🌡️', shortLabel: 'Indoor' },
  temperature_outdoor: { label: 'Outdoor Temp',   icon: '🌨️', shortLabel: 'Outdoor' },
  power_generation:    { label: 'Power Gen',      icon: '⚡',  shortLabel: 'Gen' },
  power_consumption:   { label: 'Consumption',    icon: '🔌',  shortLabel: 'Load' },
  solar_generation:    { label: 'Solar Power',    icon: '☀️',  shortLabel: 'Solar' },
  wind_generation:     { label: 'Wind Power',     icon: '💨',  shortLabel: 'Wind' },
  diesel_hours:        { label: 'Diesel Usage',   icon: '🛢️',  shortLabel: 'Diesel' },
  fuel_level:          { label: 'Fuel Level',     icon: '⛽',  shortLabel: 'Fuel' },
  water_reserve:       { label: 'Water Reserve',  icon: '💧',  shortLabel: 'Water' },
  battery_reserve:     { label: 'Battery',        icon: '🔋',  shortLabel: 'Battery' },
  wind_speed:          { label: 'Wind Speed',     icon: '🌪️',  shortLabel: 'Wind Spd' },
};
