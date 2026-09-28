import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { mockEquipment } from '../utils/mockData.js';
import { getCategoryIcon, getHealthColor } from '../utils/formatters.js';
import { RadialBarChart, RadialBar } from 'recharts';

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState(mockEquipment);
  const [station, setStation]     = useState('all');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/equipment');
        if (res.data.data?.length) setEquipment(res.data.data);
      } catch { /* use mock */ }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = station === 'all' ? equipment : equipment.filter((e) => e.station_id === station);

  const stats = {
    total:    equipment.length,
    online:   equipment.filter((e) => e.status === 'online').length,
    warning:  equipment.filter((e) => e.status === 'warning').length,
    critical: equipment.filter((e) => e.status === 'critical').length,
  };

  const HealthGauge = ({ score }) => (
    <div className="relative w-16 h-16">
      <RadialBarChart width={64} height={64} cx={32} cy={32} innerRadius={18} outerRadius={28}
        data={[{ value: score }]} startAngle={225} endAngle={-45}>
        <RadialBar dataKey="value" cornerRadius={4} fill={getHealthColor(score)} background={{ fill: '#1e293b' }} />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-xs">{score}</span>
      </div>
    </div>
  );

  const statusBadge = (status) => ({
    online:   'bg-emerald-900/50 text-emerald-300',
    warning:  'bg-amber-900/50 text-amber-300',
    critical: 'bg-red-900/50 text-red-300',
    offline:  'bg-slate-800 text-slate-400',
  }[status] || 'bg-slate-800 text-slate-400');

  const isDueSoon = (date) => date && (new Date(date) - new Date()) < 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    val: stats.total,    color: 'text-slate-300', border: 'border-slate-700'    },
          { label: 'Online',   val: stats.online,   color: 'text-emerald-400', border: 'border-emerald-700/50' },
          { label: 'Warning',  val: stats.warning,  color: 'text-amber-400', border: 'border-amber-700/50'  },
          { label: 'Critical', val: stats.critical, color: 'text-red-400',   border: 'border-red-700/50'    },
        ].map((s) => (
          <div key={s.label} className={`glass rounded-xl p-4 border ${s.border}`}>
            <p className="text-slate-500 text-xs">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Station filter */}
      <div className="glass rounded-xl p-4 flex gap-2 items-center">
        {['all', 'maitri', 'bharati'].map((s) => (
          <button key={s} onClick={() => setStation(s)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${station === s ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {s === 'all' ? '🛰️ All Stations' : `🏔️ ${s}`}
          </button>
        ))}
        <span className="ml-auto text-slate-500 text-xs">{filtered.length} units</span>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading equipment…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((eq) => (
            <div key={eq.id} className="glass rounded-xl p-5 border border-slate-700/40 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getCategoryIcon(eq.category)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusBadge(eq.status)}`}>{eq.status}</span>
                  </div>
                  <p className="text-white font-semibold text-sm truncate">{eq.name}</p>
                  <p className="text-slate-400 text-xs capitalize mt-0.5">{eq.station_id} • {eq.category?.replace('_', ' ')}</p>
                </div>
                <HealthGauge score={eq.health_score || 0} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Usage Hours</span>
                  <span className="text-slate-300 tabular-nums">{eq.usage_hours?.toLocaleString() || '—'} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Maintenance</span>
                  <span className="text-slate-300">{eq.last_maintenance || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Next Due</span>
                  <span className={isDueSoon(eq.next_maintenance) ? 'text-orange-400 font-medium' : 'text-slate-300'}>
                    {isDueSoon(eq.next_maintenance) ? '⚠️ ' : ''}{eq.next_maintenance || '—'}
                  </span>
                </div>
              </div>

              {/* Health bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Health Score</span>
                  <span style={{ color: getHealthColor(eq.health_score) }}>{eq.health_score}%</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full">
                  <div className="h-1.5 rounded-full transition-all"
                    style={{ width: `${eq.health_score}%`, backgroundColor: getHealthColor(eq.health_score) }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
