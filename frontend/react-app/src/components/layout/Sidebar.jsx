import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, Bell, Package, Settings, Users, Zap, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice.js';
import { toggleSidebar, setSelectedStation } from '../../store/slices/uiSlice.js';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alerts',    icon: Bell,            label: 'Alerts',    badge: true },
  { to: '/inventory', icon: Package,         label: 'Inventory' },
  { to: '/equipment', icon: Zap,             label: 'Equipment' },
  { to: '/users',     icon: Users,           label: 'Users',     adminOnly: true },
];

const STATIONS = [
  { id: 'both',    label: 'Both Stations', emoji: '🛰️' },
  { id: 'maitri',  label: 'Maitri',        emoji: '🏔️' },
  { id: 'bharati', label: 'Bharati',       emoji: '🏔️' },
];

const Sidebar = () => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { sidebarOpen, selectedStation } = useSelector((s) => s.ui);
  const { user }    = useSelector((s) => s.auth);
  const unreadCount = useSelector((s) => s.alerts.unreadCount);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-700/50 z-40 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 min-h-[72px]">
        <div className="w-9 h-9 flex-shrink-0 bg-cyan-600 rounded-lg flex items-center justify-center text-xl">🛰️</div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="font-bold text-white text-sm leading-tight">IARI Monitor</p>
            <p className="text-cyan-400 text-xs truncate">Antarctic Stations</p>
          </div>
        )}
      </div>

      {/* Station Selector */}
      {sidebarOpen && (
        <div className="px-3 py-3 border-b border-slate-700/50">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 px-1">Station View</p>
          {STATIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => dispatch(setSelectedStation(s.id))}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                selectedStation === s.id
                  ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!sidebarOpen && (
          <div className="mb-3">
            {STATIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => dispatch(setSelectedStation(s.id))}
                title={s.label}
                className={`w-full flex justify-center py-1.5 mb-1 rounded-lg text-base transition-colors ${
                  selectedStation === s.id ? 'bg-cyan-900/60' : 'hover:bg-slate-800'
                }`}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        )}

        {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
            {item.badge && unreadCount > 0 && (
              <span className={`${sidebarOpen ? 'ml-auto' : 'absolute top-1 right-1'} bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Collapse */}
      <div className="border-t border-slate-700/50">
        {sidebarOpen && user && (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-slate-400 text-xs capitalize">{user.role}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        )}
        {!sidebarOpen && (
          <button onClick={handleLogout} title="Logout" className="w-full py-3 flex justify-center text-slate-400 hover:text-red-400 transition-colors">
            <LogOut size={18} />
          </button>
        )}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full py-3 flex items-center justify-center text-slate-500 hover:text-cyan-400 transition-colors border-t border-slate-700/50"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
