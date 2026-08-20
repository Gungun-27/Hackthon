import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatSeverityScore } from '../utils/formatScore';
import { 
  Radio, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Car, 
  MapPin, 
  Clock, 
  User, 
  Send, 
  UserCheck, 
  ArrowLeft,
  FileText,
  Truck,
  Check,
  Phone,
  Mail,
  Lock
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AuthorityComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [departmentsAndOfficers, setDepartmentsAndOfficers] = useState<{ departments: any[]; officers: any[] }>({ departments: [], officers: [] });

  // Action states
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Assignment states
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Internal note state
  const [internalNote, setInternalNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [detailRes, deptRes] = await Promise.all([
        api.get(`/authority/complaints/${id}`),
        api.get('/authority/departments-and-officers')
      ]);
      setData(detailRes.data);
      setDepartmentsAndOfficers(deptRes.data);
      setNewStatus(detailRes.data.complaint.status);
      setSelectedDept(detailRes.data.complaint.assigned_department_id || '');
      setSelectedOfficer(detailRes.data.complaint.assigned_officer_id || '');
    } catch (err) {
      console.error('Fetch complaint detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !id) return;

    setIsUpdatingStatus(true);
    try {
      await api.patch(`/authority/complaints/${id}/status`, {
        status: newStatus,
        note: statusNote || `Status updated to ${newStatus.replace(/_/g, ' ')} by Officer ${user?.full_name}`
      });
      setStatusNote('');
      await fetchDetail();
      alert('Status updated successfully and citizen notification dispatched.');
    } catch (err) {
      alert('Failed to update complaint status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsAssigning(true);
    try {
      await api.patch(`/authority/complaints/${id}/assign`, {
        department_id: selectedDept || null,
        officer_id: selectedOfficer || null
      });
      await fetchDetail();
      alert('Department and officer assigned successfully.');
    } catch (err) {
      alert('Failed to update assignment.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim() || !id) return;

    setIsAddingNote(true);
    try {
      await api.post(`/authority/complaints/${id}/notes`, {
        note: internalNote.trim()
      });
      setInternalNote('');
      await fetchDetail();
    } catch (err) {
      alert('Failed to save internal note.');
    } finally {
      setIsAddingNote(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 bg-slate-950 text-slate-100 py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-mono">Loading operational incident record...</p>
        </div>
      </div>
    );
  }

  const { complaint, evidence = [], timeline = [], officerBriefing } = data;

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/authority/complaints"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Complaints Ledger
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            Audit Record ID: {complaint.id}
          </span>
        </div>

        {/* Top Operational Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {complaint.ticket_id}
                </span>
                <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs ${
                  (complaint.severity_score || 0) >= 8
                    ? 'bg-rose-950 border border-rose-700 text-rose-300'
                    : 'bg-amber-950 border border-amber-700 text-amber-300'
                }`}>
                  AI Severity: {formatSeverityScore(complaint.severity_score)}/10
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Filed on: {new Date(complaint.created_at).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Active State</span>
              <span className="inline-block bg-amber-500 text-slate-950 font-extrabold text-xs uppercase px-3 py-1 rounded-md mt-0.5 font-mono">
                {complaint.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* AI Officer Briefing (Section 10.2: Under 10 seconds operational summary) */}
          <div className="bg-gradient-to-r from-amber-950/40 to-slate-950 border-l-4 border-amber-500 p-4 rounded-r-xl space-y-1.5">
            <div className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Officer Briefing (Section 10.2 LLM Synthesis)
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
              {officerBriefing}
            </p>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            
            {/* Category & Parking */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Violation Category</span>
              <div className="font-bold text-white uppercase text-sm font-mono flex items-center gap-1.5">
                {complaint.issue_type === 'illegal_parking' ? <Car className="w-4 h-4 text-amber-400" /> : null}
                {complaint.issue_type.replace(/_/g, ' ')}
              </div>
              {complaint.vehicle_number && (
                <div className="text-amber-300 font-mono text-xs">
                  <strong>Vehicle:</strong> {complaint.vehicle_number} ({complaint.vehicle_type || 'Car'})
                </div>
              )}
              {complaint.tow_required ? (
                <div className="text-rose-400 font-bold text-[11px]">🚨 Tow-Truck Required</div>
              ) : null}
            </div>

            {/* Location */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Incident Location</span>
              <div className="text-slate-200 font-medium leading-tight">
                {complaint.address_text || `Lat: ${complaint.latitude}, Lng: ${complaint.longitude}`}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                GPS Accuracy: ±{complaint.location_accuracy_m || 15}m
              </div>
            </div>

            {/* Reporter Trust & Contact */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Citizen Reporter</span>
              <div className="font-semibold text-white">
                {complaint.reporter_name || 'Nagpur Resident'}
              </div>
              <div className="text-xs">
                {complaint.is_reporter_verified ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> DigiLocker Verified
                  </span>
                ) : (
                  <span className="text-slate-400">Unverified Reporter</span>
                )}
              </div>
              {complaint.reporter_phone && (
                <div className="text-[11px] text-slate-400 font-mono">
                  Phone: {complaint.reporter_phone}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Action Controls Grid (Left: Timeline & Evidence, Right: Status & Assignment Controls) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (7 cols): Evidence & Timeline */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Photographic Evidence */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Attached Evidence Gallery ({evidence.length})
              </h3>

              {evidence.length === 0 ? (
                <p className="text-xs text-slate-500">No media evidence files were submitted.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {evidence.map((ev: any, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img src={ev.storage_url} alt="Evidence" className="w-full h-40 object-cover" />
                      <div className="p-2 text-[11px] text-slate-300 font-mono text-center bg-slate-950">
                        {ev.file_type.toUpperCase()} • {new Date(ev.uploaded_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit History & Internal Notes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Complete Audit Trail & Notes
              </h3>

              <div className="space-y-3">
                {timeline.map((log: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center text-slate-400 font-mono text-[10px]">
                      <span className="uppercase font-bold text-amber-400">{log.status.replace(/_/g, ' ')}</span>
                      <span>{new Date(log.changed_at).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans">{log.note}</p>
                    {log.changed_by_name && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        Author: {log.changed_by_name} ({log.changed_by_role})
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Internal Operational Note Form */}
              <form onSubmit={handleAddInternalNote} className="pt-2 space-y-2">
                <label className="block text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" /> Add Internal Operational Note (Officer Only)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Tow truck dispatched MH31-01, arriving in 8 minutes..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAddingNote || !internalNote.trim()}
                    className="bg-slate-800 hover:bg-slate-750 text-amber-400 font-bold px-3 py-2 rounded-lg text-xs font-mono border border-slate-700 disabled:opacity-50 transition"
                  >
                    Log Note
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Right Column (5 cols): Operational Action Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Status Transition Control (Section 3.4 & 8) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" /> Transition Incident State
              </h3>

              <form onSubmit={handleStatusUpdate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">New State</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="submitted">1. Submitted (Pending Review)</option>
                    <option value="under_review">2. Under Review (Control Room)</option>
                    <option value="assigned">3. Assigned to Officer</option>
                    <option value="in_progress">4. In Progress (On-site action)</option>
                    <option value="resolved">5. Resolved (Cleared)</option>
                    <option value="closed">6. Closed (Archived)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                    Officer Resolution / Audit Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter reason or instructions for citizen (triggers automated email update)..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition shadow"
                >
                  {isUpdatingStatus ? 'Updating State...' : 'Commit Status Update'}
                </button>
              </form>
            </div>

            {/* Department & Officer Assignment */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" /> Dispatch &amp; Officer Assignment
              </h3>

              <form onSubmit={handleAssign} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Target Department / Wing</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">-- Select Zonal Department --</option>
                    {departmentsAndOfficers.departments.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.zone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Assign Field Officer</label>
                  <select
                    value={selectedOfficer}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">-- Select On-Duty Officer --</option>
                    {departmentsAndOfficers.officers.map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.officer_name} (Badge #{o.badge_number})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isAssigning}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-amber-400 font-bold py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider border border-slate-700 transition"
                >
                  {isAssigning ? 'Updating Assignment...' : 'Save Unit Assignment'}
                </button>
              </form>
            </div>

            {/* Quick Tow Squad Dispatch Tool */}
            {complaint.issue_type === 'illegal_parking' && (
              <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs font-mono uppercase">
                  <Truck className="w-4 h-4 text-rose-400" /> NMC Towing Squad Coordination
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Offending vehicle: <strong className="text-white font-mono">{complaint.vehicle_number || 'Unregistered Plate'}</strong>. Forward direct towing coordinates to Zonal Towing Van Unit #3.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    alert(`🚨 Tow Squad Alert dispatched for Vehicle ${complaint.vehicle_number || 'at location'}.`);
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs font-mono transition"
                >
                  Dispatch Zonal Towing Van
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
