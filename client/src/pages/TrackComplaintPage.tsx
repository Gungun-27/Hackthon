import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  MessageSquare, 
  Upload, 
  Send, 
  FileText, 
  Car, 
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const TrackComplaintPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  // Follow-up state
  const [commentText, setCommentText] = useState('');
  const [followupFiles, setFollowupFiles] = useState<File[]>([]);
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);
  const [followupSuccess, setFollowupSuccess] = useState(false);

  const fetchTrackingData = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/complaints/${ticketId}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || `Could not find ticket #${ticketId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [ticketId]);

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && followupFiles.length === 0) return;
    if (!data?.complaint?.id) return;

    setIsSubmittingFollowup(true);
    try {
      const formData = new FormData();
      formData.append('comment', commentText);
      formData.append('reporter_name', user?.full_name || 'Citizen');
      followupFiles.forEach(f => {
        formData.append('files', f);
      });

      await api.post(`/complaints/${data.complaint.id}/followup`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setCommentText('');
      setFollowupFiles([]);
      setFollowupSuccess(true);
      setTimeout(() => setFollowupSuccess(false), 4000);
      await fetchTrackingData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit follow-up comment.');
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 py-16 px-4 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-600 font-mono">Retrieving audit timeline for {ticketId}...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 bg-slate-50 py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">Ticket Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'Please double-check the Ticket Reference ID and try again.'}</p>
          <div className="pt-2">
            <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { complaint, timeline = [], evidence = [] } = data;

  const stages = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'assigned', label: 'Assigned to Officer' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === complaint.status);

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Citizen Portal
        </Link>

        {/* Complaint Header Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  {complaint.ticket_id}
                </span>
                {complaint.is_reporter_verified && (
                  <span className="bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified Citizen Report
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Filed on: {new Date(complaint.created_at).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Current State</span>
              <span className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-extrabold uppercase px-3 py-1 rounded-md mt-0.5">
                {complaint.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Issue Category</span>
              <strong className="text-white uppercase font-mono">{complaint.issue_type.replace(/_/g, ' ')}</strong>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Assigned Unit / Officer</span>
              <strong className="text-amber-300">
                {complaint.department_name || 'Nagpur Traffic Control Room'}
                {complaint.officer_badge ? ` (#${complaint.officer_badge})` : ''}
              </strong>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Target Resolution SLA</span>
              <strong className="text-emerald-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {complaint.estimated_resolution}
              </strong>
            </div>
          </div>

          {/* Location & Details */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-start gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Incident Location:</strong> {complaint.address_text}</span>
            </div>
            
            {complaint.vehicle_number && (
              <div className="flex items-center gap-2 text-slate-300 pl-6">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span><strong>Vehicle Number:</strong> <span className="font-mono text-amber-300 font-bold">{complaint.vehicle_number}</span> ({complaint.parking_violation_type?.replace(/_/g, ' ') || 'Parking Obstruction'})</span>
              </div>
            )}

            <div className="pt-1 text-slate-300 pl-6 leading-relaxed">
              <strong>Citizen Description:</strong> {complaint.description}
            </div>
          </div>
        </div>

        {/* Status Timeline Section (Section 3.3) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Audit Timeline & Officer Notes
            </h3>
            <span className="text-xs text-slate-500 font-mono">Real-time sync</span>
          </div>

          {/* Stepper visual bar */}
          <div className="relative flex justify-between items-center px-2 py-4">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-4 h-1 bg-amber-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${Math.max(0, (currentStageIndex / (stages.length - 1)) * 100)}%` }}
            />

            {stages.map((st, i) => {
              const isPastOrCurrent = i <= currentStageIndex;
              const isCurrent = i === currentStageIndex;

              return (
                <div key={st.key} className="relative z-10 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-200'
                      : isPastOrCurrent
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isPastOrCurrent ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1.5 hidden sm:block font-semibold ${isPastOrCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Detailed Timeline Feed */}
          <div className="space-y-4 pt-2">
            {timeline.map((log: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3.5 border-l-2 border-slate-200 pl-4 py-1 relative">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute -left-[6px] top-2"></span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex-1 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 uppercase font-mono">
                      {log.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(log.changed_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-sans">{log.note}</p>
                  {log.changed_by_name && (
                    <div className="text-[10px] text-slate-400 pt-1">
                      Logged by: <strong>{log.changed_by_name}</strong> ({log.changed_by_role})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Gallery */}
        {evidence.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Submitted Photographic Evidence ({evidence.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {evidence.map((ev: any, i: number) => (
                <div key={i} className="rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
                  <img src={ev.storage_url} alt="Evidence" className="w-full h-32 object-cover" />
                  <div className="p-1 text-[10px] text-slate-300 truncate bg-slate-950 font-mono text-center">
                    {ev.file_type.toUpperCase()} • Attached
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up / Additional Evidence Box (Section 3.3: While ticket remains open) */}
        {complaint.status !== 'closed' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-600" /> Append Follow-up Comment / Additional Proof
              </h3>
              <span className="text-xs text-slate-500">Ticket is Open</span>
            </div>

            {followupSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Follow-up remark successfully appended to the public investigation timeline.</span>
              </div>
            )}

            <form onSubmit={handleFollowupSubmit} className="space-y-3">
              <textarea
                rows={2}
                placeholder="Add additional remarks, vehicle update, or on-site status change..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 hover:bg-slate-100">
                  <Upload className="w-3.5 h-3.5 text-amber-600" />
                  <span>Attach more files ({followupFiles.length} selected)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => {
                      if (e.target.files) setFollowupFiles(Array.from(e.target.files));
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmittingFollowup || (!commentText.trim() && followupFiles.length === 0)}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingFollowup ? 'Appending...' : 'Submit Follow-up Remark'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
