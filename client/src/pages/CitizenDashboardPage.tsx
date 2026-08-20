import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatSeverityScore } from '../utils/formatScore';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Car, 
  Clock, 
  MapPin, 
  Search, 
  Plus, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints/my');
      setComplaints(res.data);
    } catch (err) {
      console.error('Fetch my complaints error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch = !searchTerm || 
      c.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.address_text && c.address_text.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* User Status Welcome Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-sans">
                Welcome, {user?.full_name || 'Citizen'}
              </h1>
              {user?.is_identity_verified ? (
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> DigiLocker Verified
                </span>
              ) : (
                <Link
                  to="/verify-identity"
                  className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-0.5 rounded-full hover:bg-amber-500/30 transition"
                >
                  ⚡ Verify with DigiLocker
                </Link>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Registered Phone: <span className="font-mono text-slate-300">{user?.phone}</span> • Email: <span className="text-slate-300">{user?.email}</span>
            </p>
          </div>

          <Link
            to="/file-complaint"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-4 h-4" /> File New Grievance
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by Ticket ID, keyword, landmark..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Statuses ({complaints.length})</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Complaints Grid / List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 font-mono">
            Loading your registered grievances...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Complaints Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No grievances matched your current filter criteria.'
                : 'You have not submitted any complaints yet. Report an issue to track progress here.'}
            </p>
            <Link
              to="/file-complaint"
              className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> File First Grievance
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComplaints.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        {c.ticket_id}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 capitalize">
                    {c.issue_type.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{c.address_text || 'Nagpur'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Priority: <strong className="text-slate-700">{formatSeverityScore(c.severity_score)}/10</strong>
                  </div>
                  <Link
                    to={`/track/${c.ticket_id}`}
                    className="font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                  >
                    Track Status <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
