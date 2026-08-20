import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Car, 
  Search, 
  ShieldCheck, 
  Activity, 
  Clock, 
  FileCheck, 
  ArrowRight, 
  PhoneCall, 
  CheckCircle2, 
  Flame, 
  Sparkles,
  MapPin,
  ExternalLink
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [ticketSearch, setTicketSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketSearch.trim()) {
      navigate(`/track/${ticketSearch.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="flex-1">
      {/* Sober GovTech Civic Hero Section (Strictly avoiding generic SaaS gradient-blobs) */}
      <section className="bg-slate-900 border-b border-slate-800 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left: Mandate & Call to Action */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Official Civic Incident & Parking Response Grid
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
                Nagpur Municipal & Traffic Police <span className="text-amber-400">Grievance Portal</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-sans">
                Report traffic jams, emergency roadblocks, road damage, and <strong className="text-white font-semibold">parking violations</strong> directly to on-duty zonal traffic officers with photographic proof and live GPS accuracy.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/file-complaint"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-lg text-sm flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all font-sans"
                >
                  <AlertTriangle className="w-5 h-5 text-slate-950" />
                  Report Grievance / Accident
                </Link>

                <Link
                  to="/file-complaint?type=illegal_parking"
                  className="bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-semibold px-5 py-3 rounded-lg text-sm flex items-center gap-2 transition"
                >
                  <Car className="w-5 h-5 text-amber-400" />
                  Report Parking Obstruction
                </Link>
              </div>

              {/* Instant Ticket Tracking Bar */}
              <div className="pt-4 max-w-lg">
                <p className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wide">
                  Public Ticket Audit Lookup (No login required)
                </p>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter Ticket ID e.g. TM-2026-004521"
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg pl-3 pr-4 py-2.5 text-xs sm:text-sm font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold border border-slate-600 flex items-center gap-1.5 shrink-0 transition"
                  >
                    <Search className="w-4 h-4 text-amber-400" /> Track
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Live City Status Panel */}
            <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-slate-200">Nagpur Traffic Status Grid</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                  ● LIVE SYNC
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                  <div className="text-slate-400 text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Avg. Response SLA
                  </div>
                  <div className="text-2xl font-mono font-bold text-white mt-1">28 mins</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Emergency triage speed</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                  <div className="text-slate-400 text-xs flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Resolution Rate
                  </div>
                  <div className="text-2xl font-mono font-bold text-white mt-1">94.2%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Audited closing records</div>
                </div>
              </div>

              {/* DigiLocker Notice */}
              <div className="bg-slate-900/90 border border-emerald-500/30 p-3.5 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-emerald-300 block font-semibold">DigiLocker Citizen Verification</strong>
                  <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                    Link your Driving License / RC via official DigiLocker Sandbox to earn the <strong className="text-white">"Verified Citizen"</strong> badge for high-priority triage.
                  </p>
                  <Link to="/verify-identity" className="text-amber-400 font-semibold inline-flex items-center gap-1 text-[11px] mt-1.5 hover:underline">
                    Verify Account Credentials <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Emergency dispatch box */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">Towing Squad Dispatch:</span>
                <span className="text-amber-400 font-bold font-mono">0712-2565100</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6 Category Grievance Matrix */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Reportable Civic & Traffic Violations
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Select an issue category to initiate an instant geocoded complaint with AI assisted description refinement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Illegal Parking */}
            <div className="border-2 border-amber-200 bg-amber-50/50 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center mb-3">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Illegal Parking & Obstruction</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Report vehicles blocking footpaths, emergency hospital gates, no-parking zones, or commercial double parking with vehicle number plates.
              </p>
              <Link to="/file-complaint?type=illegal_parking" className="mt-4 text-xs font-bold text-amber-900 flex items-center gap-1 hover:underline">
                Report Parking Violation <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Road Accidents */}
            <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 hover:border-slate-400 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center mb-3">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Road Accidents & Collisions</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Emergency priority report for vehicular collisions, overturned transport, or traffic blockades requiring immediate field police dispatch.
              </p>
              <Link to="/file-complaint?type=accident" className="mt-4 text-xs font-bold text-rose-700 flex items-center gap-1 hover:underline">
                Report Accident Incident <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: Traffic Jams */}
            <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 hover:border-slate-400 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Major Traffic Jams & Gridlocks</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Severe corridor slowdowns and bottlenecks across Nagpur junctions (Sitabuldi, Wardha Rd, Medical Sq) requiring manual marshalling.
              </p>
              <Link to="/file-complaint?type=traffic_jam" className="mt-4 text-xs font-bold text-slate-900 flex items-center gap-1 hover:underline">
                Report Traffic Bottleneck <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 4: Signal Faults */}
            <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 hover:border-slate-400 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Traffic Signal Malfunctions</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Faulty junction lights, blackout controllers, or flashing red signals causing cross-traffic panic and collision hazard.
              </p>
              <Link to="/file-complaint?type=signal_fault" className="mt-4 text-xs font-bold text-slate-900 flex items-center gap-1 hover:underline">
                Report Signal Fault <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 5: Road Damage */}
            <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 hover:border-slate-400 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Road Damage & Deep Potholes</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Unbarricaded road trenches, dangerous craters, open manholes, or waterlogging forwarded straight to NMC engineering crews.
              </p>
              <Link to="/file-complaint?type=road_damage" className="mt-4 text-xs font-bold text-teal-800 flex items-center gap-1 hover:underline">
                Report Road Crater <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 6: Rash Driving */}
            <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 hover:border-slate-400 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Rash & Dangerous Driving</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Report overspeeding, stunt riding, signal jumping, or drunk driving with evidence for automated CCTV trace and E-Challan penalization.
              </p>
              <Link to="/file-complaint?type=rash_driving" className="mt-4 text-xs font-bold text-purple-900 flex items-center gap-1 hover:underline">
                Report Rash Commuter <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works: The 5-Step GovTech Audit Workflow */}
      <section className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Transparent, Auditable Grievance Lifecycle
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-2">
              Every complaint is timestamped, scored by AI severity logic, and assigned directly to zonal traffic officers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { step: '01', title: 'Category & Location', desc: 'Select violation type and drop an accurate GPS map pin with accuracy radius.' },
              { step: '02', title: 'Evidence & AI Assist', desc: 'Attach photos/video; AI synthesizes clear description and computes urgency score (0-10).' },
              { step: '03', title: 'Ticket & QR Dispatched', desc: 'Instant unique TM-2026-XXXXXX ticket and tracking QR code dispatched via SMS & Email.' },
              { step: '04', title: 'Officer Field Action', desc: 'Assigned zonal officer dispatches towing squad, clears bottleneck, or logs internal notes.' },
              { step: '05', title: 'Resolution & Audit', desc: 'Verified photo evidence of resolution logged and archived permanently in city ledger.' }
            ].map((item, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative">
                <span className="text-2xl font-black font-mono text-amber-500">{item.step}</span>
                <h4 className="text-sm font-bold text-slate-900 mt-2">{item.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authority Command Quick Link Bar */}
      <section className="bg-slate-900 text-white py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-white font-mono flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" /> Are you an On-Duty Traffic Officer or NMC Engineer?
            </h3>
            <p className="text-xs text-slate-400">
              Access the live GIS Command Map, filter complaints by priority score, update status, and manage towing dispatch.
            </p>
          </div>
          <Link
            to="/authority/login"
            className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 px-6 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wide transition shrink-0"
          >
            Access Authority Command Room →
          </Link>
        </div>
      </section>
    </div>
  );
};
