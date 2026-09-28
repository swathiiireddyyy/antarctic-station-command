import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout      from './components/layout/Layout.jsx';
import LoginPage   from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AlertsPage  from './pages/AlertsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import EquipmentPage from './pages/EquipmentPage.jsx';
import UsersPage   from './pages/UsersPage.jsx';

// Guard: redirect to /login if not authenticated
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="alerts"    element={<AlertsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="equipment" element={<EquipmentPage />} />
        <Route path="users"     element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

export default App;
