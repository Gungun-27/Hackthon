import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Phone, Mail, User, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', formData);
      localStorage.setItem('tm_token', res.data.accessToken);
      await refreshUser();
      // Redirect to DigiLocker identity verification
      navigate('/verify-identity?new=true');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-sans">
            Citizen Registration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create your Nagpur Civic account to report and track issues
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Deshmukh"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="10-digit mobile number e.g. 9822012345"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="e.g. rajesh@nagpur.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition shadow flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="text-amber-700 font-semibold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};
