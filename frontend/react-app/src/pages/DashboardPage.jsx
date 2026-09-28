import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadialBarChart, RadialBar, Cell,
} from 'recharts';
import { fetchAlerts } from '../store/slices/alertsSlice.js';
import { fetchSensorHistory } from '../store/slices/sensorsSlice.js';
import { setTimeRange } from '../store/slices/uiSlice.js';
import {
  formatTimestamp, formatValue, getStatusColor,
  getStatusBg, getHealthColor, getAlertLevelColor,
  getAlertLevelDot, sensorLabels,
} from '../utils/formatters.js';

// ---- Sparkline (tiny inline chart) ----
const Sparkline = ({ data = [], color = '#06b6d4' }) => {
  if (!data.length) return null;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals) || 1;
  const w = 60, h = 24;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1 || 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
};

// ---- Sensor Tile ----
const SensorTile = ({ type, reading, history = [] }) => {
  const meta = sensorLabels[type] || { label: type, icon: '📊' };
  const statusColors = { online: '#10b981', warning: '#f59e0b', critical: '#ef4444' };
  const color = statusColors[reading?.status] || '#06b6d4';

  return (
    <div className={`rounded-xl p-4 border stat-card ${getStatusBg(reading?.status)}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-lg">{meta.icon}</span>
          <p className="text-slate-400 text-xs mt-1">{meta.shortLabel || meta.label}</p>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${getStatusColor(reading?.status)}`}>
          {reading?.status || '—'}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-2xl font-bold tabular-nums ${getStatusColor(reading?.status)}`}>
            {reading?.value?.toFixed(1) ?? '—'}
          </p>
          <p className="text-slate-500 text-xs">{reading?.unit || ''}</p>
        </div>
        <Sparkline data={history} color={color} />
      </div>
    </div>
  );
};

// ---- Station Card ----
const StationCard = ({ stationId, stationName }) => {
  const station = useSelector((s) => s.sensors[stationId]);
  const { health_score, system_status, lastUpdated, sensors } = station || {};

  const gaugeData = [{ value: health_score || 0, fill: getHealthColor(health_score || 0) }];
  const statusBadge = {
    online:   { text: '✅ Online',   cls: 'text-emerald-400 bg-emerald-900/40' },
    warning:  { text: '⚠️ Warning',  cls: 'text-amber-400 bg-amber-900/40'   },
    critical: { text: '❌ Critical', cls: 'text-red-400 bg-red-900/40'        },
  }[system_status] || { text: '— Unknown', cls: 'text-slate-400 bg-slate-800' };

  const quickStats = [
    { label: 'Indoor',   value: `${sensors?.temperature_indoor?.value?.toFixed(1) ?? '—'}°C`,  color: 'text-cyan-400'    },
    { label: 'Power Gen',value: `${sensors?.power_generation?.value?.toFixed(1) ?? '—'} kW`,   color: 'text-yellow-400'  },
    { label: 'Fuel',     value: `${sensors?.fuel_level?.value?.toFixed(1) ?? '—'}%`,            color: 'text-orange-400'  },
    { label: 'Water',    value: `${sensors?.water_reserve?.value?.toFixed(1) ?? '—'}%`,         color: 'text-blue-400'    },
  ];

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">🏔️ {stationName}</h2>
          <p className="text-slate-400 text-xs mt-0.5 capitalize">{stationId === 'maitri' ? 'Schirmacher Oasis' : 'Larsemann Hills'}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge.cls}`}>{statusBadge.text}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Health gauge */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <RadialBarChart width={96} height={96} cx={48} cy={48} innerRadius={28} outerRadius={44}
            data={[{ value: health_score || 0 }]} startAngle={225} endAngle={-45}>
            <RadialBar dataKey="value" cornerRadius={6} fill={getHealthColor(health_score || 0)}
              background={{ fill: '#1e293b' }} />
          </RadialBarChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white font-bold text-lg leading-none">{health_score || 0}</span>
            <span className="text-slate-400 text-xs">Health</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          {quickStats.map((s) => (
            <div key={s.label} className="bg-slate-800/60 rounded-lg px-3 py-2">
              <p className="text-slate-500 text-xs">{s.label}</p>
              <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-slate-600 text-xs">
        🕐 Updated {formatTimestamp(lastUpdated)}
      </p>
    </div>
  );
};

// ---- Custom Tooltip ----
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

// ---- Time Range Selector ----
const TimeRangeSelector = ({ value, onChange }) => (
  <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
    {['1h', '6h', '24h', '7d'].map((r) => (
      <button key={r} onClick={() => onChange(r)}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${value === r ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
        {r}
      </button>
    ))}
  </div>
);

// ---- Main Dashboard ----
const DashboardPage = () => {
  const dispatch = useDispatch();
  const selectedStation = useSelector((s) => s.ui.selectedStation);
  const timeRange  = useSelector((s) => s.ui.timeRange);
  const maitri     = useSelector((s) => s.sensors.maitri);
  const bharati    = useSelector((s) => s.sensors.bharati);
  const history    = useSelector((s) => s.sensors.history);
  const recentAlerts = useSelector((s) => s.alerts.items.slice(0, 5));

  const stations = selectedStation === 'both' ? ['maitri', 'bharati']
    : selectedStation === 'maitri' ? ['maitri'] : ['bharati'];

  useEffect(() => {
    dispatch(fetchAlerts({ limit: 20 }));
    dispatch(fetchSensorHistory({ stationId: 'maitri',  sensorType: 'power_generation',   hours: 24 }));
    dispatch(fetchSensorHistory({ stationId: 'maitri',  sensorType: 'power_consumption',  hours: 24 }));
    dispatch(fetchSensorHistory({ stationId: 'maitri',  sensorType: 'temperature_indoor', hours: 24 }));
    dispatch(fetchSensorHistory({ stationId: 'bharati', sensorType: 'power_generation',   hours: 24 }));
    dispatch(fetchSensorHistory({ stationId: 'bharati', sensorType: 'power_consumption',  hours: 24 }));
  }, [dispatch]);

  // Build chart data from history
  const buildChartData = (stationId, sensorType) => {
    const data = history[stationId]?.[sensorType] || [];
    const step = timeRange === '1h' ? 12 : timeRange === '6h' ? 6 : timeRange === '7d' ? 24 : 4;
    return data.filter((_, i) => i % step === 0).map((p) => ({
      time: new Date(p.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      value: p.value,
    }));
  };

  const powerData = buildChartData('maitri', 'power_generation').map((p, i) => ({
    ...p,
    gen: p.value,
    cons: buildChartData('maitri', 'power_consumption')[i]?.value || 0,
  }));

  const tempData = buildChartData('maitri', 'temperature_indoor').map((p) => ({
    time: p.time, indoor: p.value,
    outdoor: (history['maitri']?.temperature_outdoor || [])
      .filter((_, i) => i % 4 === 0)[buildChartData('maitri', 'temperature_indoor').indexOf(p)]?.value || -22,
  }));

  const resourceData = ['maitri', 'bharati'].map((sid) => ({
    name: sid === 'maitri' ? 'Maitri' : 'Bharati',
    fuel:    parseFloat((sid === 'maitri' ? maitri : bharati)?.sensors?.fuel_level?.value || 0),
    water:   parseFloat((sid === 'maitri' ? maitri : bharati)?.sensors?.water_reserve?.value || 0),
    battery: parseFloat((sid === 'maitri' ? maitri : bharati)?.sensors?.battery_reserve?.value || 0),
  }));

  const SENSOR_TYPES = [
    'temperature_indoor','temperature_outdoor','power_generation','power_consumption',
    'solar_generation','wind_generation','fuel_level','water_reserve','battery_reserve','wind_speed',
  ];

  return (
    <div className="space-y-6">
      {/* Row 1 — Station Cards */}
      <div className={`grid gap-4 ${stations.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-lg'}`}>
        {stations.map((sid) => (
          <StationCard key={sid} stationId={sid} stationName={sid === 'maitri' ? 'Maitri Station' : 'Bharati Station'} />
        ))}
      </div>

      {/* Row 2 — Sensor tiles */}
      {stations.map((sid) => {
        const stationData = sid === 'maitri' ? maitri : bharati;
        return (
          <div key={sid}>
            {stations.length > 1 && (
              <h3 className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
                🏔️ {sid === 'maitri' ? 'Maitri' : 'Bharati'} — Live Sensors
                <span className="text-slate-600 font-normal">({SENSOR_TYPES.length} sensors)</span>
              </h3>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {SENSOR_TYPES.map((type) => (
                <SensorTile
                  key={type} type={type}
                  reading={stationData?.sensors?.[type]}
                  history={history[sid]?.[type] || []}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Row 3 — Charts */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="text-white font-semibold">⚡ Power Analytics</h3>
          <TimeRangeSelector value={timeRange} onChange={(r) => dispatch(setTimeRange(r))} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Power Gen vs Consumption */}
          <div>
            <p className="text-slate-400 text-xs mb-3">Maitri — Generation vs Consumption (kW)</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={powerData}>
                <defs>
                  <linearGradient id="genGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Area type="monotone" dataKey="gen"  name="Generation" stroke="#06b6d4" fill="url(#genGrad)"  strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="cons" name="Consumption" stroke="#f59e0b" fill="url(#consGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Temperature Chart */}
          <div>
            <p className="text-slate-400 text-xs mb-3">Maitri — Temperature (°C)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tempData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Line type="monotone" dataKey="indoor"  name="Indoor °C"  stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="outdoor" name="Outdoor °C" stroke="#38bdf8" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resources Bar Chart */}
        <div className="mt-6">
          <p className="text-slate-400 text-xs mb-3">Station Resources Comparison (%)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={resourceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="fuel"    name="Fuel %"    fill="#f97316" radius={[0, 4, 4, 0]} />
              <Bar dataKey="water"   name="Water %"   fill="#38bdf8" radius={[0, 4, 4, 0]} />
              <Bar dataKey="battery" name="Battery %"  fill="#a78bfa" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4 — Recent Alerts */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">🔔 Recent Alerts</h3>
          <a href="/alerts" className="text-cyan-400 hover:text-cyan-300 text-xs transition-colors">View all →</a>
        </div>
        {recentAlerts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">🟢 No recent alerts</p>
        ) : (
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertLevelColor(alert.level)}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getAlertLevelDot(alert.level)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                      alert.status === 'active' ? 'bg-red-900/50 text-red-300' :
                      alert.status === 'acknowledged' ? 'bg-amber-900/50 text-amber-300' :
                      'bg-emerald-900/50 text-emerald-300'}`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-xs opacity-70 mt-0.5 truncate">{alert.message}</p>
                </div>
                <p className="text-xs opacity-50 flex-shrink-0 whitespace-nowrap">{formatTimestamp(alert.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
