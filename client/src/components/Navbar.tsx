import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  User as UserIcon, 
  LogOut, 
  Radio, 
  Menu, 
  X,
  Car
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, quickLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [quickTrackId, setQuickTrackId] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Feature flag: only render demo role switcher when explicitly enabled
  const showDemoSwitcher = import.meta.env.VITE_ENABLE_DEMO_ROLE_SWITCH === 'true';

  const isAuthorityPath = location.pathname.startsWith('/authority');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackId.trim()) {
      navigate(`/track/${quickTrackId.trim().toUpperCase()}`);
      setQuickTrackId('');
    }
  };

  const handleQuickRole = async (role: 'citizen_verified' | 'citizen_unverified' | 'officer' | 'admin') => {
    setDemoMenuOpen(false);
    await quickLogin(role);
    if (role === 'officer' || role === 'admin') {
      navigate('/authority');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Official Government Emblem & Emergency Hotline Bar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">Nagpur Municipal Corporation & Nagpur Traffic Police</span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">Official Citizen Grievance Portal</span>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3" /> Control Hotline: 1095
            </span>
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Emergency: 112
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 text-slate-950 font-black" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-white font-mono">TrafficMitra</span>
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                    Nagpur
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans tracking-wide">Civic Safety & Traffic Reporting</p>
              </div>
            </Link>
          </div>

          {/* Quick Ticket Lookup in Header (for desktop) */}
          <form onSubmit={handleTrackSubmit} className="hidden md:flex items-center relative max-w-xs w-full mx-4">
            <input
              type="text"
              placeholder="Track ticket e.g. TM-2026-..."
              value={quickTrackId}
              onChange={(e) => setQuickTrackId(e.target.value)}
              className="w-full bg-slate-800/90 text-sm text-slate-100 placeholder-slate-400 border border-slate-700 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
            />
            <button type="submit" className="absolute right-2.5 text-slate-400 hover:text-amber-400 transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-5">
            {!isAuthorityPath ? (
              <>
                <Link to="/file-complaint" className="flex items-center gap-1.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 rounded-lg shadow-sm transition">
                  <AlertTriangle className="w-4 h-4" /> Report Issue
                </Link>
                <Link to="/file-complaint?type=illegal_parking" className="flex items-center gap-1.5 text-sm text-slate-200 hover:text-amber-400 transition">
                  <Car className="w-4 h-4 text-amber-400" /> Parking Violations
                </Link>
                {isAuthenticated && (
                  <Link to="/dashboard" className="text-sm text-slate-200 hover:text-white transition">
                    My Complaints
                  </Link>
                )}
                <Link to="/authority/login" className="text-sm text-slate-400 hover:text-slate-200 border-l border-slate-700 pl-4 transition">
                  Authority Command
                </Link>
              </>
            ) : (
              <>
                <Link to="/authority" className="flex items-center gap-1.5 text-sm text-slate-200 hover:text-amber-400 transition">
                  <Radio className="w-4 h-4 text-emerald-400" /> Live Command Map
                </Link>
                <Link to="/authority/complaints" className="text-sm text-slate-200 hover:text-amber-400 transition">
                  Complaints Ledger
                </Link>
                <Link to="/authority/analytics" className="text-sm text-slate-200 hover:text-amber-400 transition">
                  Analytics & Heatmap
                </Link>
                <Link to="/" className="text-sm text-slate-400 hover:text-slate-200 border-l border-slate-700 pl-4 transition">
                  Citizen Portal
                </Link>
              </>
            )}

            {/* Quick Demo Switcher — only rendered when VITE_ENABLE_DEMO_ROLE_SWITCH=true */}
            {showDemoSwitcher && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-md font-mono flex items-center gap-1"
                >
                  Demo Role ▾
                </button>
                {demoMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50 text-xs">
                    <div className="px-3 py-1 text-slate-400 font-bold uppercase tracking-wider text-[10px]">Switch Demo Identity:</div>
                    <button
                      onClick={() => handleQuickRole('citizen_verified')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                    >
                      <span>Rajesh (Verified Citizen)</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => handleQuickRole('citizen_unverified')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200"
                    >
                      Pooja (Unverified Citizen)
                    </button>
                    <button
                      onClick={() => handleQuickRole('officer')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-amber-300 font-semibold"
                    >
                      👮 Officer Patil (Traffic Police)
                    </button>
                    <button
                      onClick={() => handleQuickRole('admin')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-cyan-300 font-semibold"
                    >
                      🏢 NMC Control Room Admin
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* User Profile & Auth State */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 border-l border-slate-700 pl-4">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white flex items-center justify-end gap-1">
                    {user?.full_name}
                    {user?.is_identity_verified && (
                      <span title="DigiLocker Verified Citizen" className="inline-flex items-center text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">{user?.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 border-l border-slate-700 pl-4">
                <Link to="/login" className="text-sm text-slate-200 hover:text-white px-3 py-1.5 transition">
                  Login
                </Link>
                <Link to="/register" className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 px-3 py-1.5 rounded-lg transition">
                  Register
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-3">
          <form onSubmit={handleTrackSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Track ticket e.g. TM-2026-..."
              value={quickTrackId}
              onChange={(e) => setQuickTrackId(e.target.value)}
              className="w-full bg-slate-800 text-sm text-slate-100 placeholder-slate-400 border border-slate-700 rounded-lg pl-3 pr-8 py-2 font-mono text-xs"
            />
            <button type="submit" className="absolute right-2.5 top-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-col space-y-2 pt-2">
            <Link to="/file-complaint" onClick={() => setMobileMenuOpen(false)} className="bg-amber-500 text-slate-950 font-bold px-3 py-2 rounded text-center">
              Report Issue / Traffic Jam
            </Link>
            <Link to="/file-complaint?type=illegal_parking" onClick={() => setMobileMenuOpen(false)} className="text-slate-200 hover:text-white px-2 py-1.5">
              Report Parking Violation
            </Link>
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-slate-200 hover:text-white px-2 py-1.5">
              My Complaints
            </Link>
            <Link to="/authority" onClick={() => setMobileMenuOpen(false)} className="text-slate-200 hover:text-white px-2 py-1.5">
              Authority Command Dashboard
            </Link>
            <Link to="/verify-identity" onClick={() => setMobileMenuOpen(false)} className="text-emerald-400 px-2 py-1.5">
              DigiLocker Identity Verification
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
