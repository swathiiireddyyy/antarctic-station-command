import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { UserPlus, RefreshCw } from 'lucide-react';
import api from '../services/api.js';

const ROLES = ['admin', 'operator', 'scientist', 'guest'];
const ROLE_COLORS = {
  admin:     'bg-purple-900/50 text-purple-300',
  operator:  'bg-cyan-900/50 text-cyan-300',
  scientist: 'bg-blue-900/50 text-blue-300',
  guest:     'bg-slate-800 text-slate-400',
};

const SEED_USERS = [
  { id: 'u1', name: 'NCPOR Admin',     email: 'admin@ncpor.res.in',    role: 'admin',     is_active: true, last_login: null },
  { id: 'u2', name: 'Station Operator',email: 'operator@maitri.in',    role: 'operator',  is_active: true, last_login: null },
  { id: 'u3', name: 'Dr. Priya Sharma',email: 'scientist@bharati.in',  role: 'scientist', is_active: true, last_login: null },
  { id: 'u4', name: 'Guest User',      email: 'guest@iari.in',         role: 'guest',     is_active: true, last_login: null },
];

const UsersPage = () => {
  const currentUser = useSelector((s) => s.auth.user);
  const [users,   setUsers]   = useState(SEED_USERS);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'operator' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.data?.length) setUsers(res.data.data);
    } catch { /* use seed */ }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/users', form);
      setSuccess('User created successfully.');
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', role: 'operator' });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await api.delete(`/users/${user.id}`);
      } else {
        await api.put(`/users/${user.id}`, { is_active: true });
      }
      loadUsers();
    } catch { /* best-effort */ }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">User Management</h2>
          <p className="text-slate-400 text-sm">{users.length} registered users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadUsers} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors">
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {success && <div className="p-3 bg-emerald-950 border border-emerald-700/50 rounded-lg text-emerald-300 text-sm">✅ {success}</div>}

      {/* Users table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Login</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-800 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-slate-200 font-medium">{user.name}</p>
                        {user.id === currentUser?.id && <p className="text-cyan-400 text-xs">← You</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${ROLE_COLORS[user.role] || 'bg-slate-800 text-slate-400'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.is_active ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {user.last_login ? new Date(user.last_login).toLocaleString('en-IN') : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    {user.id !== currentUser?.id && (
                      <button onClick={() => handleToggleActive(user)}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${
                          user.is_active
                            ? 'bg-red-900/40 hover:bg-red-900/60 text-red-400'
                            : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400'
                        }`}>
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-white font-semibold mb-5">👤 Add New User</h3>
            {error && <div className="p-3 mb-4 bg-red-950 border border-red-700/50 rounded-lg text-red-300 text-sm">{error}</div>}
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Full Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="Dr. Rajesh Kumar" />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="user@ncpor.res.in" />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Password</label>
                <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="Min. 8 characters" minLength={8} />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                  {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-cyan-700 hover:bg-cyan-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  Create User
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setError(''); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
