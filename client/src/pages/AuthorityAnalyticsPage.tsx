import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Activity, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Car, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  Truck,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import { CommandMap } from '../components/CommandMap';
import type { MapComplaint } from '../components/CommandMap';

export const AuthorityAnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<MapComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [sumRes, heatRes] = await Promise.all([
        api.get('/authority/analytics/summary'),
        api.get('/authority/analytics/heatmap')
      ]);
      setSummary(sumRes.data);
      setHeatmapPoints(heatRes.data.points);
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex-1 bg-slate-950 text-slate-100 pt-16 py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-mono">Synthesizing city-wide analytics & heatmap coordinates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 pt-6 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <Link to="/authority" className="text-amber-400 text-xs font-mono hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Command Map
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight mt-1">
              Nagpur Civic Safety Analytics & Heatmap
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              City-wide operational intelligence, SLA compliance, and density hotspots
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" /> Current Quarter 2026
          </div>
        </div>

        {/* Top KPIs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-xs font-mono uppercase">Total Registered</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black font-mono text-white mt-2">
              {summary.total_complaints}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              {summary.active_complaints} currently active in triage
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-xs font-mono uppercase">Avg Resolution SLA</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black font-mono text-amber-400 mt-2">
              {summary.avg_resolution_hours} hrs
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              SLA Compliance: <strong className="text-emerald-400">{summary.sla_compliance_percentage}%</strong>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-xs font-mono uppercase">Verified Citizens</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
              {summary.verified_reporters_count}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              DigiLocker Sandbox verified reporters
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-xs font-mono uppercase">Parking Violations</span>
              <Truck className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black font-mono text-rose-400 mt-2">
              {summary.parking_violations_count}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary.tow_dispatched_count} tow van dispatches authorized
            </div>
          </div>

        </div>

        {/* Heatmap Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" /> Nagpur Incident Hotspot Heatmap
              </h2>
              <p className="text-xs text-slate-400">
                Spatial concentration of traffic bottlenecks, illegal parking, and accidents across Nagpur wards
              </p>
            </div>
            <span className="bg-rose-950 border border-rose-800 text-rose-300 text-xs font-mono px-3 py-1 rounded">
              Overlay: Active Hotspots
            </span>
          </div>

          <div className="h-[460px] rounded-xl overflow-hidden">
            <CommandMap
              complaints={heatmapPoints}
              onSelectComplaint={() => {}}
              showHeatOverlay={true}
            />
          </div>
        </div>

        {/* Breakdown Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Category Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase">
              Incident Breakdown by Category
            </h3>
            <div className="space-y-3">
              {summary.category_breakdown?.map((cat: any, i: number) => {
                const percentage = summary.total_complaints > 0 
                  ? ((cat.count / summary.total_complaints) * 100).toFixed(0) 
                  : 0;

                return (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="capitalize text-slate-200">{cat.issue_type.replace(/_/g, ' ')}</span>
                      <span className="text-slate-400">{cat.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-Day Trend */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase">
              Weekly Grievance Volume vs Resolution Trend
            </h3>
            <div className="grid grid-cols-7 gap-2 pt-6 items-end h-48">
              {summary.weekly_trend?.map((day: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1.5 text-[10px] font-mono h-full justify-end">
                  <div className="w-full flex gap-1 items-end justify-center h-32">
                    <div
                      className="w-3 bg-amber-500/80 rounded-t"
                      style={{ height: `${(day.filed / 45) * 100}%` }}
                      title={`Filed: ${day.filed}`}
                    />
                    <div
                      className="w-3 bg-emerald-500/80 rounded-t"
                      style={{ height: `${(day.resolved / 45) * 100}%` }}
                      title={`Resolved: ${day.resolved}`}
                    />
                  </div>
                  <span className="text-slate-400">{day.date}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 text-xs font-mono pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span> Complaints Filed
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Resolved On-Site
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
