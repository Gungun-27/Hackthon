import React from 'react';
import { Shield, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Platform Overview */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <span className="font-bold text-white text-lg font-mono">TrafficMitra</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unified citizen grievance, parking enforcement, and intelligent incident triage system for Nagpur Municipal Corporation & Nagpur City Traffic Police.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Version 2.4-GOV • Nagpur Smart City ICCC
            </div>
          </div>

          {/* Col 2: Zonal Commands */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Zonal Control Rooms</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Central Zone: Sitabuldi (0712-2565100)</li>
              <li>• West Zone: Dharampeth & WHC Road</li>
              <li>• North Zone: Sadar & Mankapur</li>
              <li>• South Zone: Dhantoli & Wardha Road</li>
              <li>• East Zone: Itwari & Gandhibagh Market</li>
            </ul>
          </div>

          {/* Col 3: Quick Links & Compliance */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Compliance & Standards</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3 text-amber-400" /> DigiLocker Sandbox Verified
              </li>
              <li>• Motor Vehicles Act (Section 133/177)</li>
              <li>• NMC Encroachment Act 1956</li>
              <li>• Privacy & Audit Log Encryption</li>
              <li>• Right to Public Services (Maharashtra)</li>
            </ul>
          </div>

          {/* Col 4: Emergency Contacts */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Helplines & Dispatch</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Traffic Control Hotline: <strong className="text-amber-400 font-mono">1095</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-4 h-4 text-rose-400" />
                <span>Police Emergency: <strong className="text-rose-400 font-mono">112</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Nagpur Traffic Police HQ, Civil Lines, Nagpur</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>grievance@nagpurtrafficmitra.gov.in</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <div>
            © 2026 Nagpur Municipal Corporation & Nagpur City Police. Designed for Civic Operational Reliability.
          </div>
          <div className="flex space-x-4">
            <span className="text-emerald-400 font-mono">● System Status: OPERATIONAL</span>
            <span>Zero Data Brokerage</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
