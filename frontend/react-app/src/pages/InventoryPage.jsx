import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { mockInventory } from '../utils/mockData.js';
import { getCategoryIcon, getInventoryStatusColor, formatTimestamp } from '../utils/formatters.js';

const CATEGORIES = ['all', 'fuel', 'water', 'food', 'medical', 'consumables', 'equipment_parts'];

const InventoryPage = () => {
  const [inventory, setInventory] = useState({ maitri: mockInventory.maitri, bharati: mockInventory.bharati });
  const [station, setStation]     = useState('maitri');
  const [category, setCategory]   = useState('all');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [m, b] = await Promise.all([
          api.get('/inventory/stations/maitri'),
          api.get('/inventory/stations/bharati'),
        ]);
        setInventory({ maitri: m.data.data, bharati: b.data.data });
      } catch { /* use mock */ }
      setLoading(false);
    };
    load();
  }, []);

  const items = (inventory[station] || []).filter((i) => category === 'all' || i.category === category);

  const allItems = [...(inventory.maitri || []), ...(inventory.bharati || [])];
  const stats = {
    total:    allItems.length,
    low:      allItems.filter((i) => i.percentage <= 20 && i.percentage > 10).length,
    critical: allItems.filter((i) => i.percentage <= 10).length,
    expiring: allItems.filter((i) => {
      if (!i.expiry_date) return false;
      return (new Date(i.expiry_date) - new Date()) < 30 * 24 * 60 * 60 * 1000;
    }).length,
  };

  const isExpiringSoon = (date) => {
    if (!date) return false;
    return (new Date(date) - new Date()) < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Items',   val: stats.total,    color: 'text-slate-300',   border: 'border-slate-700'       },
          { label: 'Low Stock',     val: stats.low,      color: 'text-amber-400',   border: 'border-amber-700/50'    },
          { label: 'Critical',      val: stats.critical, color: 'text-red-400',     border: 'border-red-700/50'      },
          { label: 'Expiring Soon', val: stats.expiring, color: 'text-orange-400',  border: 'border-orange-700/50'   },
        ].map((s) => (
          <div key={s.label} className={`glass rounded-xl p-4 border ${s.border}`}>
            <p className="text-slate-500 text-xs">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Station + Category filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {['maitri', 'bharati'].map((s) => (
            <button key={s} onClick={() => setStation(s)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize font-medium transition-colors ${station === s ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              🏔️ {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${category === c ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {c === 'all' ? 'All' : `${getCategoryIcon(c)} ${c}`}
            </button>
          ))}
        </div>
        <span className="ml-auto text-slate-500 text-xs">{items.length} items</span>
      </div>

      {/* Inventory table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading inventory…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left w-48">Level</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Expiry</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize text-xs">
                      {getCategoryIcon(item.category)} {item.category}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getInventoryStatusColor(item.percentage)}`}
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-300 tabular-nums w-10 text-right">{item.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs tabular-nums">
                      {item.current_quantity?.toLocaleString()} / {item.max_capacity?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{item.unit}</td>
                    <td className="px-4 py-3 text-xs">
                      {item.expiry_date ? (
                        <span className={isExpiringSoon(item.expiry_date) ? 'text-orange-400 font-medium' : 'text-slate-400'}>
                          {isExpiringSoon(item.expiry_date) ? '⚠️ ' : ''}{item.expiry_date}
                        </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.percentage <= 10 ? 'bg-red-900/50 text-red-300' :
                        item.percentage <= 20 ? 'bg-amber-900/50 text-amber-300' :
                        'bg-emerald-900/50 text-emerald-300'}`}>
                        {item.percentage <= 10 ? 'Critical' : item.percentage <= 20 ? 'Low' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
