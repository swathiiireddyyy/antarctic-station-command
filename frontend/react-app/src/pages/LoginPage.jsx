import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { loginUser, clearError } from '../store/slices/authSlice.js';

const DEMO_CREDS = [
  { role: 'Admin',     email: 'admin@ncpor.res.in',   password: 'Admin@1234'    },
  { role: 'Operator',  email: 'operator@maitri.in',   password: 'Operator@1234' },
  { role: 'Scientist', email: 'scientist@bharati.in', password: 'Scientist@1234'},
  { role: 'Guest',     email: 'guest@iari.in',        password: 'Guest@1234'    },
];

const LoginPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) navigate('/dashboard');
  };

  const fillDemo = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    dispatch(clearError());
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Aurora gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-900/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-900/25 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-teal-900/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
        {/* Stars */}
        {[...Array(40)].map((_, i) => (
          <div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60"
            style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s` }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🛰️</div>
            <h1 className="text-2xl font-bold text-white">IARI Monitor</h1>
            <p className="text-cyan-400 font-medium mt-1">Indian Antarctic Research Stations</p>
            <p className="text-slate-500 text-sm mt-1">Ministry of Earth Sciences • NCPOR</p>
          </div>

          {/* Station badges */}
          <div className="flex gap-2 justify-center mb-6">
            {['🏔️ Maitri Station', '🏔️ Bharati Station'].map((s) => (
              <span key={s} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-400 text-xs">{s}</span>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/80 border border-red-700/50 rounded-lg text-red-300 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-xs mb-1.5 uppercase tracking-wider">Email Address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@ncpor.res.in"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><Loader size={16} className="animate-spin" /> Signing in…</> : '🔐 Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-slate-700/50">
            <p className="text-slate-500 text-xs text-center mb-3">— Demo Credentials —</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDS.map((c) => (
                <button key={c.role} onClick={() => fillDemo(c)}
                  className="text-left px-3 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 rounded-lg transition-colors">
                  <p className="text-cyan-400 text-xs font-semibold">{c.role}</p>
                  <p className="text-slate-500 text-xs truncate">{c.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          🇮🇳 Secure access — Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
