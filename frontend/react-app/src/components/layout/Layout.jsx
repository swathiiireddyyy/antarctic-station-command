import React from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import NotificationToast from '../ui/NotificationToast.jsx';
import useSocket from '../../hooks/useSocket.js';

const Layout = () => {
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);
  useSocket(); // Connect WebSocket at layout level

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}
      >
        <TopBar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
        <footer className="px-6 py-3 border-t border-slate-800 text-slate-600 text-xs flex items-center justify-between">
          <span>🇮🇳 NCPOR — National Centre for Polar and Ocean Research, MoES</span>
          <span>IARI Monitor v1.0</span>
        </footer>
      </div>
      <NotificationToast />
    </div>
  );
};

export default Layout;
