import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(identifier, password);
      if (user.role === 'officer' || user.role === 'admin') {
        navigate('/authority');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role: 'citizen_verified' | 'citizen_unverified') => {
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/dashboard');
    } catch {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-amber-400 mb-3 border border-slate-800">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-sans">
            Citizen Login
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your registered civic grievances & tracking history
          </p>
        </div>

        {/* 1-Click Demo Accounts for Judges / Reviewers */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
          <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
            ⚡ Quick Demo Citizen Accounts:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoClick('citizen_verified')}
              className="bg-white hover:bg-amber-100/80 border border-amber-300 text-slate-900 p-2 rounded-lg text-left transition"
            >
              <div className="text-xs font-bold flex items-center gap-1">
                Rajesh <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold">Verified Citizen</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('citizen_unverified')}
              className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 p-2 rounded-lg text-left transition"
            >
              <div className="text-xs font-bold">Pooja K.</div>
              <div className="text-[10px] text-slate-500">Unverified Reporter</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email or Phone Number</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. rajesh.deshmukh@nagpur.in"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <span className="text-[11px] text-slate-400">Default: citizen123</span>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-2.5 rounded-lg text-sm transition shadow flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
          <Link to="/register" className="text-amber-800 font-semibold hover:underline">
            Create an Account
          </Link>
          <Link to="/authority/login" className="text-slate-500 hover:text-slate-900 font-medium">
            Officer Login →
          </Link>
        </div>
      </div>
    </div>
  );
};
