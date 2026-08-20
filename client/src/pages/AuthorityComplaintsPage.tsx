import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatSeverityScore } from '../utils/formatScore';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Radio, 
  Car, 
  AlertTriangle, 
  ArrowUpDown, 
  ChevronRight, 
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';
import api from '../services/api';

export const AuthorityComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [issueType, setIssueType] = useState('all');
  const [isVerified, setIsVerified] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const navigate = useNavigate();

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/authority/complaints', {
        params: {
          search,
          status,
          issue_type: issueType,
          is_verified: isVerified,
          sort_by: sortBy,
          sort_order: sortOrder,
          limit: 100
        }
      });
      setComplaints(res.data.complaints);
    } catch (err) {
      console.error('Fetch complaints error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [status, issueType, isVerified, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/authority/complaints/${id}/status`, {
        status: newStatus,
        note: `Quick triage status change to '${newStatus}' from ledger.`
      });
      await fetchComplaints();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Link to="/authority" className="text-amber-400 text-xs font-mono hover:underline">
                ← Return to Command Map
              </Link>
            </div>
            <h1 className="text-2xl font-extrabold text-white font-mono tracking-tight mt-1">
              Grievances Operational Ledger
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Live filterable queue prioritized by AI urgency score and verification credibility
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchComplaints}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Link
              to="/authority"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition shadow"
            >
              <Radio className="w-3.5 h-3.5" /> GIS Command View
            </Link>
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by ticket ID, vehicle plate (e.g. MH31), landmark..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-xs font-mono border border-slate-600 transition shrink-0"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">State Filter</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">All States</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Category</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="illegal_parking">Illegal Parking (Suite)</option>
                <option value="accident">Accident</option>
                <option value="traffic_jam">Traffic Jam</option>
                <option value="signal_fault">Signal Fault</option>
                <option value="road_damage">Road Damage</option>
                <option value="rash_driving">Rash Driving</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Reporter Trust</label>
              <select
                value={isVerified}
                onChange={(e) => setIsVerified(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">All Reporters</option>
                <option value="1">Verified Citizen (DigiLocker)</option>
                <option value="0">Unverified Reporter</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Sort Priority</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split('-');
                  setSortBy(sb);
                  setSortOrder(so);
                }}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="severity_score-desc">Highest AI Severity First</option>
                <option value="severity_score-asc">Lowest AI Severity First</option>
                <option value="ticket_id-asc">Ticket ID Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Ticket Reference</th>
                  <th className="py-3.5 px-4">Category / Metadata</th>
                  <th className="py-3.5 px-4">Location &amp; Zone</th>
                  <th className="py-3.5 px-4">AI Score (0-10)</th>
                  <th className="py-3.5 px-4">Reporter Status</th>
                  <th className="py-3.5 px-4">State Transition</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                      Querying complaints database...
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                      No complaints matched the active query filters.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-850 transition">
                      
                      {/* Ticket */}
                      <td className="py-3.5 px-4 font-mono">
                        <Link
                          to={`/authority/complaints/${c.id}`}
                          className="font-bold text-amber-400 hover:underline block"
                        >
                          {c.ticket_id}
                        </Link>
                        <span className="text-[10px] text-slate-500">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Category & Plate */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200 capitalize flex items-center gap-1.5">
                          {c.issue_type === 'illegal_parking' ? <Car className="w-3.5 h-3.5 text-amber-400" /> : null}
                          {c.issue_type.replace(/_/g, ' ')}
                        </div>
                        {c.vehicle_number && (
                          <div className="font-mono text-[11px] text-amber-300 mt-0.5">
                            Plate: {c.vehicle_number}
                          </div>
                        )}
                        {c.tow_required && (
                          <span className="text-[10px] text-rose-400 font-bold block">
                            🚨 Tow Squad Alert
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-300 truncate">{c.address_text || 'Nagpur'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {c.department_zone || 'Central Zone'}
                        </div>
                      </td>

                      {/* AI Severity Score with Hover Tooltip (Section 3.4) */}
                      <td className="py-3.5 px-4">
                        <div
                          className="inline-flex items-center gap-1 cursor-help group relative"
                          title={c.severity_reasoning || 'AI Severity Score'}
                        >
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            (c.severity_score || 0) >= 8
                              ? 'bg-rose-950 border border-rose-700 text-rose-300'
                              : (c.severity_score || 0) >= 5
                              ? 'bg-amber-950 border border-amber-700 text-amber-300'
                              : 'bg-blue-950 border border-blue-700 text-blue-300'
                          }`}>
                            {formatSeverityScore(c.severity_score)}/10
                          </span>
                          <Sparkles className="w-3 h-3 text-slate-400 group-hover:text-amber-400" />
                        </div>
                      </td>

                      {/* Reporter Status */}
                      <td className="py-3.5 px-4">
                        {c.is_reporter_verified ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Citizen
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Unverified</span>
                        )}
                      </td>

                      {/* State Transition Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={c.status}
                          onChange={(e) => handleQuickStatusChange(c.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        >
                          <option value="submitted">Submitted</option>
                          <option value="under_review">Under Review</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate(`/authority/complaints/${c.id}`)}
                          className="bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold inline-flex items-center gap-1 transition"
                        >
                          Inspect <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
