import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Car, 
  Flame, 
  AlertTriangle, 
  Activity, 
  MapPin, 
  ShieldCheck, 
  Upload, 
  Sparkles, 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Camera, 
  Copy, 
  CheckCircle2,
  Trash2,
  Phone,
  Mail,
  User,
  Info
} from 'lucide-react';
import { MapPicker } from '../components/MapPicker';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatSeverityScore } from '../utils/formatScore';

export const FileComplaintPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || '';
  const initialDesc = searchParams.get('desc') || '';
  const initialLoc = searchParams.get('loc') || '';

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Multi-step progress (1: Type, 2: Location, 3: Evidence, 4: Description & AI Assist, 5: Review & Submit)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [issueType, setIssueType] = useState<string>(initialType || 'traffic_jam');
  
  // Dedicated Parking Violation fields
  const [parkingViolationType, setParkingViolationType] = useState<string>('footpath_encroachment');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('car_suv');
  const [towRequired, setTowRequired] = useState<boolean>(false);

  // Location State
  const [location, setLocation] = useState({
    lat: 21.1458,
    lng: 79.0882,
    address: initialLoc || 'Sitabuldi Square, Nagpur, Maharashtra',
    accuracy: 15
  });

  // Evidence Files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<{ name: string; url: string; type: string }[]>([]);

  // Description & AI Assistance
  const [rawDescription, setRawDescription] = useState<string>(initialDesc || '');
  const [aiSuggestion, setAiSuggestion] = useState<{
    enhanced_description: string;
    severity_score: number;
    reasoning: string;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);

  // Guest reporter details (if not logged in)
  const [reporterName, setReporterName] = useState(user?.full_name || '');
  const [reporterPhone, setReporterPhone] = useState(user?.phone || '');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketId: string;
    complaintId: string;
    trackingUrl: string;
    severity_score: number;
    severity_reasoning: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto AI trigger when user finishes typing description
  const triggerAiAssist = async () => {
    if (!rawDescription.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await api.post('/complaints/ai-assist', {
        issue_type: issueType,
        raw_text: rawDescription,
        address_text: location.address
      });
      setAiSuggestion(res.data);
    } catch (err) {
      console.error('AI Assist error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Validate size (25MB max)
    const valid = files.filter(f => f.size <= 25 * 1024 * 1024);
    if (valid.length !== files.length) {
      alert('Some files were ignored because they exceed the 25MB limit.');
    }

    setSelectedFiles(prev => [...prev, ...valid].slice(0, 5));

    const newPreviews = valid.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : (f.type.startsWith('audio/') ? 'audio' : 'photo')
    }));

    setPreviewUrls(prev => [...prev, ...newPreviews].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitComplaint = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('issue_type', issueType);
      formData.append('description', rawDescription);
      if (aiSuggestion?.enhanced_description) {
        formData.append('ai_enhanced_description', aiSuggestion.enhanced_description);
      }
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('location_accuracy_m', location.accuracy.toString());
      formData.append('address_text', location.address);

      if (aiSuggestion?.severity_score !== undefined) {
        formData.append('severity_score', aiSuggestion.severity_score.toString());
        formData.append('severity_reasoning', aiSuggestion.reasoning);
      }

      if (issueType === 'illegal_parking') {
        formData.append('parking_violation_type', parkingViolationType);
        formData.append('vehicle_number', vehicleNumber);
        formData.append('vehicle_type', vehicleType);
        formData.append('tow_required', towRequired ? '1' : '0');
      }

      if (!isAuthenticated) {
        formData.append('reporter_name', reporterName || 'Nagpur Resident');
        formData.append('reporter_phone', reporterPhone || '9890000000');
        formData.append('reporter_email', reporterEmail || 'citizen@nagpur.gov.in');
      }

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSubmittedTicket(res.data);
    } catch (err: any) {
      console.error('Submission error:', err);
      alert(err.response?.data?.error || 'Failed to submit grievance. Please verify all required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicket = () => {
    if (!submittedTicket) return;
    navigator.clipboard.writeText(submittedTicket.ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If successfully submitted, show on-screen confirmation with QR code (Section 3.2)
  if (submittedTicket) {
    const fullTrackingUrl = `${window.location.origin}/track/${submittedTicket.ticketId}`;

    return (
      <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
          
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Officially Registered with Nagpur Control Room
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-2 font-sans">
              Grievance Registered Successfully
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your report has been assigned to the zonal traffic & municipal dispatch unit.
            </p>
          </div>

          {/* Ticket ID Box */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Unique Ticket Reference</div>
              <div className="text-2xl font-black font-mono text-amber-400 tracking-wider">
                {submittedTicket.ticketId}
              </div>
            </div>
            <button
              onClick={copyTicket}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* QR Code Container (Section 3.2) */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl inline-block mx-auto">
            <QRCodeSVG value={fullTrackingUrl} size={150} level="H" includeMargin={false} />
            <p className="text-[11px] font-mono text-slate-500 mt-3">
              Scan QR code on mobile to track live timeline
            </p>
          </div>

          {/* AI Urgency Snapshot */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-left text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> AI Priority Triage: Score {formatSeverityScore(submittedTicket.severity_score)}/10
            </div>
            <div className="text-[11px] text-amber-800 mt-0.5">{submittedTicket.severity_reasoning}</div>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/track/${submittedTicket.ticketId}`}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-4 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow"
            >
              Open Live Tracking Timeline <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg text-xs transition flex items-center justify-center"
            >
              View My Complaints
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Step Progress Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                File a Civic Grievance / Traffic Incident
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Nagpur Smart City Public Safety & Parking Response
              </p>
            </div>
            <div className="flex items-center space-x-1 text-xs font-mono">
              <span className="font-bold text-amber-600">Step {currentStep}</span>
              <span className="text-slate-400">/ 5</span>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
            {[
              { num: 1, title: 'Category' },
              { num: 2, title: 'Location' },
              { num: 3, title: 'Evidence' },
              { num: 4, title: 'AI Assist' },
              { num: 5, title: 'Review' }
            ].map((st) => (
              <button
                key={st.num}
                type="button"
                disabled={st.num > currentStep && !rawDescription}
                onClick={() => setCurrentStep(st.num)}
                className={`py-2 px-1 rounded-lg border text-[11px] sm:text-xs transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  currentStep === st.num
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-400/20'
                    : currentStep > st.num
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-400 bg-slate-50'
                }`}
              >
                <span>{st.num}.</span>
                <span>{st.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1: Issue Category Selection */}
        {currentStep === 1 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 1: Select Grievance Category</h2>
              <p className="text-xs text-slate-500">Choose the type of incident or violation you wish to report.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                { id: 'illegal_parking', label: 'Illegal Parking / Obstruction', icon: Car, desc: 'Footpath blocking, no-parking zone, double parking, hospital gate blocked', badge: 'Special Suite' },
                { id: 'traffic_jam', label: 'Traffic Jam & Gridlock', icon: AlertTriangle, desc: 'Corridor bottleneck, junction slowdown, transit standstill' },
                { id: 'accident', label: 'Road Accident', icon: Flame, desc: 'Vehicle collision, overturned transport, immediate safety hazard' },
                { id: 'signal_fault', label: 'Signal Malfunction', icon: Activity, desc: 'Non-operational signal, flashing red, faulty timer cycle' },
                { id: 'road_damage', label: 'Road Damage / Pothole', icon: MapPin, desc: 'Dangerous crater, trench, open drain, road structural failure' },
                { id: 'rash_driving', label: 'Rash / Dangerous Driving', icon: ShieldCheck, desc: 'Overspeeding, stunt riding, dangerous maneuvering' }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = issueType === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIssueType(item.id)}
                    className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {item.badge && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{item.label}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="mt-3 text-xs font-bold text-amber-700 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* If Illegal Parking is selected, show specialized parking fields */}
            {issueType === 'illegal_parking' && (
              <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-xl p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                  <Car className="w-5 h-5 text-amber-600" />
                  <span>Parking Violation Specifics:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Violation Sub-Type</label>
                    <select
                      value={parkingViolationType}
                      onChange={(e) => setParkingViolationType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="footpath_encroachment">Footpath / Pedestrian Walkway Encroachment</option>
                      <option value="hospital_emergency_gate">Hospital / Emergency Exit Obstruction (Critical)</option>
                      <option value="no_parking">Designated No-Parking Zone</option>
                      <option value="double_parking">Double Parking / Blocking Active Lane</option>
                      <option value="commercial_loading">Commercial Loading during Peak Hours</option>
                      <option value="abandoned_vehicle">Abandoned / Dumped Vehicle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Offending Vehicle Plate Number (e.g. MH31-XX-XXXX)
                    </label>
                    <input
                      type="text"
                      placeholder="MH-31-EK-7700"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Classification</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="2_wheeler">2-Wheeler (Motorcycle / Scooter)</option>
                      <option value="auto_tempo">3-Wheeler Auto / Delivery Tempo</option>
                      <option value="car_suv">Private Car / SUV</option>
                      <option value="heavy_truck_bus">Heavy Commercial Truck / Private Bus</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="towCheck"
                      checked={towRequired}
                      onChange={(e) => setTowRequired(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <label htmlFor="towCheck" className="text-xs font-bold text-rose-700 cursor-pointer">
                      🚨 Request Immediate NMC Towing Squad Dispatch
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm flex items-center gap-1.5 transition shadow"
              >
                Proceed to Location Selection <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Location on Interactive Map */}
        {currentStep === 2 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 2: Incident Location (Nagpur Grid)</h2>
              <p className="text-xs text-slate-500">
                Click or drag the pin to mark the exact spot. You can also use live GPS or search Nagpur landmarks.
              </p>
            </div>

            <MapPicker
              initialLat={location.lat}
              initialLng={location.lng}
              initialAddress={location.address}
              onLocationSelect={(loc) => setLocation(loc)}
            />

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Category
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm flex items-center gap-1.5 transition shadow"
              >
                Proceed to Evidence Upload <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Multi-Media Evidence */}
        {currentStep === 3 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 3: Attach Photographic Evidence</h2>
              <p className="text-xs text-slate-500">
                Upload clear images or short video clips showing the violation, number plate, or road hazard (Max 5 files, 25MB each).
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/30 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center group">
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-amber-100 group-hover:bg-amber-200 text-amber-700 flex items-center justify-center mb-3 transition">
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Click or Drag Photos / Video Files here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported: JPEG, PNG, MP4, WEBM • Up to 5 files
              </p>
            </label>

            {/* Thumbnails Preview */}
            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Attached Evidence Files ({previewUrls.length}/5):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {previewUrls.map((file, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 group bg-slate-900">
                      {file.type === 'photo' ? (
                        <img src={file.url} alt={file.name} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center text-xs text-slate-300 font-mono">
                          [{file.type.toUpperCase()}]
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[10px] text-slate-300 truncate px-1.5 py-0.5">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Location
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm flex items-center gap-1.5 transition shadow"
              >
                Proceed to Description & AI Assist <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Description with Live AI-Assisted Rewrite & Severity Scoring */}
        {currentStep === 4 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 4: Describe the Issue & AI Enhancement</h2>
              <p className="text-xs text-slate-500">
                Type what you observed. Our AI assistant will analyze the text to suggest a structured summary and calculate operational severity.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Incident Description
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe what happened, vehicles involved, lane obstruction, or any immediate hazard..."
                value={rawDescription}
                onChange={(e) => {
                  setRawDescription(e.target.value);
                  setAiApplied(false);
                }}
                onBlur={triggerAiAssist}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* AI Action Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={triggerAiAssist}
                disabled={isAiLoading || !rawDescription.trim()}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                {isAiLoading ? 'Synthesizing with Claude/LLM...' : 'Generate AI Description & Severity'}
              </button>

              <span className="text-[11px] text-slate-400">
                Preserves factual details without silent overwrites
              </span>
            </div>

            {/* AI Suggestion Chip (Section 3.2: Dismissible Chip) */}
            {aiSuggestion && (
              <div className="bg-slate-900 text-slate-100 border border-slate-700 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                    <Sparkles className="w-4 h-4" /> AI Assist Triage Preview
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-950 border border-rose-800 text-rose-300 text-xs font-mono font-bold px-2 py-0.5 rounded">
                      Severity: {formatSeverityScore(aiSuggestion.severity_score)}/10
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5">
                  <div className="text-slate-400 font-mono text-[10px] uppercase">Operational Rewrite:</div>
                  <p className="text-slate-200 leading-relaxed font-sans bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    {aiSuggestion.enhanced_description}
                  </p>
                  <div className="text-[11px] text-slate-400">
                    <strong>Triage Rationale:</strong> {aiSuggestion.reasoning}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRawDescription(aiSuggestion.enhanced_description);
                      setAiApplied(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-md text-xs transition flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Use AI Enhanced Version
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiSuggestion(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md text-xs transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Reporter Contact Info if Guest */}
            {!isAuthenticated && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-600" /> Reporter Contact Information (For SMS/Email Ticket Alerts)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Mobile Number (SMS)</label>
                    <input
                      type="tel"
                      placeholder="9822000000"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Email (Tracking Link)</label>
                    <input
                      type="email"
                      placeholder="citizen@nagpur.in"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Evidence
              </button>
              <button
                type="button"
                disabled={!rawDescription.trim()}
                onClick={() => setCurrentStep(5)}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm flex items-center gap-1.5 transition shadow"
              >
                Proceed to Review & Submit <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Final Review & Submit */}
        {currentStep === 5 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 5: Review Grievance Summary</h2>
              <p className="text-xs text-slate-500">
                Please double-check all details before final transmission to Nagpur Traffic Police.
              </p>
            </div>

            {/* Summary Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-900 uppercase font-mono">{issueType.replace(/_/g, ' ')}</span>
              </div>

              {issueType === 'illegal_parking' && (
                <>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Violation Type:</span>
                    <span className="font-semibold text-slate-900">{parkingViolationType.replace(/_/g, ' ')}</span>
                  </div>
                  {vehicleNumber && (
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Vehicle Number:</span>
                      <span className="font-mono font-bold text-slate-900">{vehicleNumber}</span>
                    </div>
                  )}
                  {towRequired && (
                    <div className="text-rose-700 font-bold">
                      🚨 Tow-Truck Squad Dispatch Requested
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Incident Location:</span>
                <span className="font-semibold text-slate-900 text-right max-w-xs truncate">{location.address}</span>
              </div>

              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block mb-1">Description:</span>
                <p className="text-slate-800 bg-white p-2.5 rounded border border-slate-200 leading-relaxed font-sans">
                  {rawDescription}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Evidence Files:</span>
                <span className="font-semibold text-slate-900">{selectedFiles.length} file(s) attached</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Reporter Status:</span>
                <span className="font-semibold">
                  {user?.is_identity_verified ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> DigiLocker Verified Citizen
                    </span>
                  ) : (
                    <span className="text-slate-600">Standard Citizen Reporter</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Edit Description
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitComplaint}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-lg text-sm uppercase tracking-wider flex items-center gap-2 transition shadow-lg"
              >
                {isSubmitting ? (
                  <span>Transmitting to Nagpur Control Room...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Submit Official Grievance
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
