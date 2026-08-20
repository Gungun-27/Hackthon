import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Radio, UserCheck, ShieldAlert, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthorityLoginPage: React.FC = () => {
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
        setError('Unauthorized: This portal is restricted to authorized traffic officers and NMC administrators.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid authority credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoOfficer = async (role: 'officer' | 'admin') => {
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/authority');
    } catch {
      setError('Failed demo officer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center text-slate-100">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/30">
            <Radio className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white font-mono tracking-tight">
            Authority Command Login
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Nagpur Traffic Police • Municipal Corporation Command Room
          </p>
        </div>

        {/* Demo Authority Credentials Panel */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> Authorized Test Credentials:
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleDemoOfficer('officer')}
              className="bg-slate-900 hover:bg-slate-800 text-left p-2.5 rounded-lg border border-slate-700 transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-amber-300">👮 Inspector Sanjay Patil (Traffic Police)</div>
                <div className="text-[10px] text-slate-400 font-mono">Badge: NTP-3101 • Pass: officer123</div>
              </div>
              <span className="text-xs text-amber-400 font-mono font-bold">Login →</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoOfficer('admin')}
              className="bg-slate-900 hover:bg-slate-800 text-left p-2.5 rounded-lg border border-slate-700 transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-cyan-300">🏢 NMC Control Room Dispatcher</div>
                <div className="text-[10px] text-slate-400 font-mono">Admin Console • Pass: admin123</div>
              </div>
              <span className="text-xs text-cyan-400 font-mono font-bold">Login →</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-300 text-xs p-3 rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Official Govt Email</label>
            <input
              type="text"
              required
              placeholder="officer@nagpurtrafficpolice.gov.in"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Encrypted Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 font-mono"
          >
            {loading ? 'Validating Session...' : 'Authenticate Command Access'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Citizen reporting grievance?{' '}
          <Link to="/" className="text-amber-400 hover:underline">
            Return to Citizen Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
