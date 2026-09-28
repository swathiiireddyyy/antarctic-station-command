import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { toggleSidebar, toggleSound } from '../../store/slices/uiSlice.js';
import { clearUnread } from '../../store/slices/alertsSlice.js';

const PAGE_TITLES = {
  '/dashboard': '📊 Live Dashboard',
  '/alerts':    '🔔 Alert Management',
  '/inventory': '📦 Inventory',
  '/equipment': '⚡ Equipment Status',
  '/users':     '👥 User Management',
};

const TopBar = () => {
  const dispatch    = useDispatch();
  const location    = useLocation();
  const unreadCount = useSelector((s) => s.alerts.unreadCount);
  const { soundEnabled } = useSelector((s) => s.ui);
  const connected   = useSelector((s) => s.sensors.connected);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const title = PAGE_TITLES[location.pathname] || 'IARI Monitor';

  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-4 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-white font-semibold text-base">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Live clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
          <span className="text-slate-400 text-xs">🕐</span>
          <span className="text-slate-200 text-xs font-mono tabular-nums">
            {now.toLocaleTimeString('en-IN', { hour12: false })}
          </span>
          <span className="text-slate-500 text-xs">IST</span>
        </div>

        {/* Connection status */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden md:block">{connected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => dispatch(toggleSound())}
          title={soundEnabled ? 'Mute alerts' : 'Enable alert sounds'}
          className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-cyan-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'}`}
        >
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>

        {/* Alert bell */}
        <button
          onClick={() => dispatch(clearUnread())}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Alerts"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
