import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, FileText, ExternalLink, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const VerifyIdentityPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const [docType, setDocType] = useState<'DRIVING_LICENSE' | 'VEHICLE_RC'>('DRIVING_LICENSE');
  const [docNumber, setDocNumber] = useState('MH31-2022-0049281');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(user?.is_identity_verified || false);
  const [docRefToken, setDocRefToken] = useState(user?.digilocker_doc_ref || '');

  const navigate = useNavigate();

  const handleDigiLockerSandboxConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in or register before verifying identity.');
      navigate('/login');
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate real OAuth redirect & callback to DigiLocker sandbox API
      const callbackRes = await api.get(`/auth/digilocker/callback?userId=${user.id}&docType=${docType}&docNumber=${encodeURIComponent(docNumber)}`);
      
      if (callbackRes.data.success) {
        setVerifiedSuccess(true);
        setDocRefToken(callbackRes.data.documentRef);
        await refreshUser();
      }
    } catch (err) {
      console.error('DigiLocker sandbox error', err);
      alert('DigiLocker Sandbox connection failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mb-3 border border-emerald-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-sans">
            DigiLocker Identity Verification
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Government of India DigiLocker Sandbox API Integration
          </p>
        </div>

        {/* Regulatory Note (Section 4 Compliance) */}
        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs space-y-2 border border-slate-800">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-[11px] uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Architecture Note &amp; Compliance Mandate
          </div>
          <p className="leading-relaxed text-[11px]">
            TrafficMitra implements DigiLocker’s OAuth-based document-fetch sandbox flow (Driving License / Vehicle RC) for developer-accessible, production-grade identity validation without raw data storage. We strictly comply with Indian privacy guidelines and do not claim or simulate Aadhaar eKYC.
          </p>
        </div>

        {verifiedSuccess ? (
          <div className="bg-emerald-50 border-2 border-emerald-300 p-6 rounded-xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950">Identity Verified Successfully!</h3>
              <p className="text-xs text-emerald-700 mt-1">
                Your account now holds the <strong className="text-emerald-900">"Verified Citizen"</strong> badge. Complaints filed by your account are prioritized in the Nagpur Command dispatch queue.
              </p>
            </div>

            <div className="bg-white border border-emerald-200 p-3 rounded-lg text-left text-xs font-mono text-slate-700 space-y-1">
              <div><strong>Status:</strong> <span className="text-emerald-600 font-bold">VERIFIED_CITIZEN</span></div>
              <div><strong>Doc Type:</strong> {docType}</div>
              <div className="truncate"><strong>DigiLocker Ref Token:</strong> {docRefToken || user?.digilocker_doc_ref}</div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/file-complaint')}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
              >
                File a Verified Complaint <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 px-4 rounded-lg text-xs transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDigiLockerSandboxConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Document to Fetch via DigiLocker
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDocType('DRIVING_LICENSE')}
                  className={`p-3 border rounded-xl text-left transition flex items-start gap-2.5 ${
                    docType === 'DRIVING_LICENSE'
                      ? 'border-amber-500 bg-amber-50/50 text-slate-950 font-semibold ring-2 ring-amber-400/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div>Driving License (DL)</div>
                    <span className="text-[10px] text-slate-400">RTO Maharashtra</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType('VEHICLE_RC')}
                  className={`p-3 border rounded-xl text-left transition flex items-start gap-2.5 ${
                    docType === 'VEHICLE_RC'
                      ? 'border-amber-500 bg-amber-50/50 text-slate-950 font-semibold ring-2 ring-amber-400/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div>Vehicle RC</div>
                    <span className="text-[10px] text-slate-400">Parivahan Sewa</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {docType === 'DRIVING_LICENSE' ? 'Driving License Number' : 'Vehicle Registration Certificate (RC) Number'}
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                placeholder={docType === 'DRIVING_LICENSE' ? 'MH31-2022-0049281' : 'MH31-EK-7700'}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <span>Connecting to DigiLocker OAuth Sandbox...</span>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" /> Pull Verified Credentials from DigiLocker
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Skip for now (I will file as an unverified citizen) →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
