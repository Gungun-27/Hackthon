import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Radio, 
  ShieldCheck, 
  AlertTriangle, 
  Car, 
  Filter, 
  CheckCircle2, 
  ChevronRight, 
  Flame, 
  Sparkles, 
  Layers,
  Clock,
  ListFilter
} from 'lucide-react';
import { CommandMap } from '../components/CommandMap';
import type { MapComplaint } from '../components/CommandMap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const AuthorityCommandMapPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<MapComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<MapComplaint | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Quick stats
  const [stats, setStats] = useState({ total_open: 0, total_critical: 0 });

  const fetchAuthorityComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/authority/complaints', {
        params: {
          status: statusFilter,
          issue_type: typeFilter,
          is_verified: verifiedFilter,
          limit: 200
        }
      });
      setComplaints(res.data.complaints);
      setStats(res.data.stats);

      // Select first critical item by default
      if (res.data.complaints.length > 0 && !selectedComplaint) {
        setSelectedComplaint(res.data.complaints[0]);
      }
    } catch (err) {
      console.error('Fetch authority map error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorityComplaints();
  }, [statusFilter, typeFilter, verifiedFilter]);

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col min-h-screen">
      
      {/* Authority Command Sub-header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white font-mono tracking-tight flex items-center gap-2">
              Nagpur Live Command Grid
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-mono">
                ● 24x7 DISPATCH
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-sans">
              Officer On Duty: <strong className="text-slate-200">{user?.full_name}</strong> {user?.badge_number ? `(#${user.badge_number})` : ''}
            </p>
          </div>
        </div>

        {/* Quick View Switcher & Heatmap Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition ${
              showHeatmap
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showHeatmap ? 'Heatmap: ACTIVE' : 'Density Heatmap'}
          </button>

          <Link
            to="/authority/complaints"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition"
          >
            <ListFilter className="w-3.5 h-3.5 text-amber-400" />
            Table Ledger View
          </Link>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Center Map & Controls (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Quick Filters Strip */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px]">FILTERS:</span>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">All States</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">All Issue Categories</option>
                <option value="illegal_parking">Illegal Parking</option>
                <option value="traffic_jam">Traffic Jam</option>
                <option value="accident">Accident</option>
                <option value="signal_fault">Signal Fault</option>
                <option value="road_damage">Road Damage</option>
                <option value="rash_driving">Rash Driving</option>
              </select>

              <select
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">All Reporters</option>
                <option value="1">Verified Citizen Only</option>
                <option value="0">Unverified Reporter</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-400">Active Incidents: <strong className="text-amber-400">{stats.total_open}</strong></span>
              <span className="text-slate-400">Critical (≥8.0): <strong className="text-rose-400">{stats.total_critical}</strong></span>
            </div>
          </div>

          {/* Leaflet Command Map */}
          <div className="flex-1 min-h-[500px]">
            <CommandMap
              complaints={complaints}
              selectedComplaintId={selectedComplaint?.id}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
              showHeatOverlay={showHeatmap}
            />
          </div>
        </div>

        {/* Right: Quick Inspector & Officer Triage Card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex-1 flex flex-col justify-between">
            {selectedComplaint ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {selectedComplaint.ticket_id}
                    </span>
                    <h3 className="text-base font-extrabold text-white capitalize mt-2">
                      {selectedComplaint.issue_type.replace(/_/g, ' ')}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                      (selectedComplaint.severity_score || 0) >= 8
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      Score: {selectedComplaint.severity_score}/10
                    </span>
                  </div>
                </div>

                {/* Reporter verification status */}
                <div className="text-xs">
                  {selectedComplaint.is_reporter_verified ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> DigiLocker Verified Reporter
                    </span>
                  ) : (
                    <span className="text-slate-400">Unverified Reporter</span>
                  )}
                </div>

                {/* Parking Specifics */}
                {selectedComplaint.vehicle_number && (
                  <div className="bg-slate-950 border border-amber-500/30 p-3 rounded-lg text-xs space-y-1">
                    <div className="text-[10px] text-amber-400 font-mono uppercase font-bold">Parking Violation Metadata</div>
                    <div className="font-mono text-white font-bold">Vehicle: {selectedComplaint.vehicle_number}</div>
                    {selectedComplaint.tow_required && (
                      <div className="text-rose-400 font-bold text-[11px]">🚨 Tow-Truck Squad Alerted</div>
                    )}
                  </div>
                )}

                {/* Address */}
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Incident Location:</div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200">
                    {selectedComplaint.address_text || `Coordinates: ${selectedComplaint.latitude}, ${selectedComplaint.longitude}`}
                  </div>
                </div>

                {/* AI Rationale Preview */}
                {selectedComplaint.severity_reasoning && (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs space-y-1">
                    <div className="text-[10px] text-amber-400 font-mono uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Triage Rationale
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {selectedComplaint.severity_reasoning}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => navigate(`/authority/complaints/${selectedComplaint.id}`)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow"
                  >
                    Open Full Inspection & Action Console <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs font-mono">
                Click any incident pin on the map to inspect operational details.
              </div>
            )}

            {/* Quick Link to Analytics */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
              <Link to="/authority/analytics" className="text-amber-400 hover:underline font-mono text-[11px]">
                View SLA & Heatmap Analytics →
              </Link>
              <Link to="/authority/complaints" className="text-slate-400 hover:text-white font-mono text-[11px]">
                All ({complaints.length})
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
