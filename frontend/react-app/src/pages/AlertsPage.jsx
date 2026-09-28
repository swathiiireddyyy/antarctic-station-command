import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAlerts, acknowledgeAlert, resolveAlert } from '../store/slices/alertsSlice.js';
import { getAlertLevelColor, getAlertLevelDot, formatTimestamp } from '../utils/formatters.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

const LEVELS  = ['all', 'red', 'yellow', 'green'];
const STATUSES = ['all', 'active', 'acknowledged', 'resolved'];

const AlertsPage = () => {
  const dispatch = useDispatch();
  const { items: alerts, loading, unreadCount } = useSelector((s) => s.alerts);
  const [filterLevel,   setFilterLevel]   = useState('all');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [filterStation, setFilterStation] = useState('all');
  const [resolveId,     setResolveId]     = useState(null);
  const [actionText,    setActionText]    = useState('');

  useEffect(() => { dispatch(fetchAlerts({ limit: 100 })); }, [dispatch]);

  const filtered = alerts.filter((a) => {
    if (filterLevel   !== 'all' && a.level      !== filterLevel)   return false;
    if (filterStatus  !== 'all' && a.status      !== filterStatus)  return false;
    if (filterStation !== 'all' && a.station_id  !== filterStation) return false;
    return true;
  });

  const stats = {
    total: alerts.length, active: alerts.filter((a) => a.status === 'active').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
    red: alerts.filter((a) => a.level === 'red').length,
    yellow: alerts.filter((a) => a.level === 'yellow').length,
  };

  const handleAcknowledge = (id) => dispatch(acknowledgeAlert(id));
  const handleResolve = (id) => {
    dispatch(resolveAlert({ id, action_taken: actionText }));
    setResolveId(null); setActionText('');
  };

  const levelBadge = (level) => ({
    red:    '🔴 Critical', yellow: '🟡 Warning', green: '🟢 Normal',
  }[level] || level);

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', val: stats.total,  color: 'border-slate-700 text-slate-300'   },
          { label: 'Active',       val: stats.active,  color: 'border-red-700/50 text-red-400'    },
          { label: 'Acknowledged', val: stats.acknowledged, color: 'border-amber-700/50 text-amber-400' },
          { label: 'Resolved',     val: stats.resolved, color: 'border-emerald-700/50 text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className={`glass rounded-xl p-4 border ${s.color}`}>
            <p className="text-slate-500 text-xs">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs">Station:</span>
          <select value={filterStation} onChange={(e) => setFilterStation(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500">
            <option value="all">All</option>
            <option value="maitri">Maitri</option>
            <option value="bharati">Bharati</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500 text-xs mr-1">Level:</span>
          {LEVELS.map((l) => (
            <button key={l} onClick={() => setFilterLevel(l)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${filterLevel === l ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500 text-xs mr-1">Status:</span>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${filterStatus === s ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-slate-500 text-xs">{filtered.length} alerts</span>
      </div>

      {/* Alerts Table */}
      {loading ? (
        <div className="py-12 flex justify-center"><LoadingSpinner text="Loading alerts…" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl py-12 text-center text-slate-500">🟢 No alerts match the current filters</div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Level</th>
                  <th className="px-4 py-3 text-left">Station</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getAlertLevelDot(alert.level)}`} />
                        <span className="text-xs">{levelBadge(alert.level)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      <span className="text-cyan-400 text-xs">{alert.station_id}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-200 text-xs font-medium truncate">{alert.title}</p>
                      <p className="text-slate-500 text-xs truncate">{alert.message}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs tabular-nums">
                      {alert.value != null ? `${alert.value.toFixed(1)} (thr: ${alert.threshold})` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatTimestamp(alert.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        alert.status === 'active' ? 'bg-red-900/50 text-red-300' :
                        alert.status === 'acknowledged' ? 'bg-amber-900/50 text-amber-300' :
                        'bg-emerald-900/50 text-emerald-300'}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {alert.status === 'active' && (
                          <button onClick={() => handleAcknowledge(alert.id)}
                            className="px-2 py-1 bg-amber-900/50 hover:bg-amber-800/50 text-amber-300 text-xs rounded transition-colors">
                            Ack
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button onClick={() => setResolveId(alert.id)}
                            className="px-2 py-1 bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 text-xs rounded transition-colors">
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-white font-semibold mb-4">✅ Resolve Alert</h3>
            <p className="text-slate-400 text-sm mb-4">Describe the action taken to resolve this alert:</p>
            <textarea value={actionText} onChange={(e) => setActionText(e.target.value)} rows={3}
              placeholder="e.g. Refueled diesel tanks, restored water pressure..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleResolve(resolveId)}
                className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                Resolve
              </button>
              <button onClick={() => { setResolveId(null); setActionText(''); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
