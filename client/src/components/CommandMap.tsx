import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Shield, AlertTriangle, Car, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatSeverityScore } from '../utils/formatScore';

export interface MapComplaint {
  id: string;
  ticket_id: string;
  issue_type: string;
  latitude: number;
  longitude: number;
  severity_score: number;
  severity_reasoning?: string;
  status: string;
  address_text?: string;
  is_reporter_verified?: boolean;
  tow_required?: boolean;
  vehicle_number?: string;
}

interface CommandMapProps {
  complaints: MapComplaint[];
  selectedComplaintId?: string | null;
  onSelectComplaint: (complaint: MapComplaint) => void;
  showHeatOverlay?: boolean;
}

export const CommandMap: React.FC<CommandMapProps> = ({
  complaints,
  selectedComplaintId,
  onSelectComplaint,
  showHeatOverlay = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.LayerGroup | null>(null);

  // Helper to generate custom colored SVGs for Leaflet divIcon
  const createCustomIcon = (severity: number, status: string, issueType: string, isSelected: boolean) => {
    let bgColor = '#f59e0b'; // Amber default
    let borderColor = '#b45309';

    if (status === 'resolved' || status === 'closed') {
      bgColor = '#10b981'; // Green
      borderColor = '#047857';
    } else if (severity >= 8.0) {
      bgColor = '#ef4444'; // Red
      borderColor = '#b91c1c';
    } else if (severity < 5.0) {
      bgColor = '#3b82f6'; // Blue/Slate
      borderColor = '#1d4ed8';
    }

    const isParking = issueType === 'illegal_parking';
    const isAccident = issueType === 'accident';
    const iconLetter = isParking ? 'P' : (isAccident ? '!' : '●');
    const scaleClass = isSelected ? 'scale-125 ring-4 ring-amber-400 z-50' : 'hover:scale-110';

    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: ${bgColor};
          border: 2px solid ${borderColor};
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        " class="${scaleClass}">
          ${iconLetter}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([21.1458, 79.0882], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Nagpur Smart City GIS',
        maxZoom: 18
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      heatLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  // Update markers whenever complaints change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !heatLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    heatLayerRef.current.clearLayers();

    complaints.forEach((c) => {
      if (!c.latitude || !c.longitude) return;

      const isSelected = c.id === selectedComplaintId;
      const icon = createCustomIcon(c.severity_score || 5, c.status, c.issue_type, isSelected);

      const marker = L.marker([c.latitude, c.longitude], { icon });

      const verifiedBadge = c.is_reporter_verified
        ? '<span style="background-color: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">✓ Verified Citizen</span>'
        : '<span style="background-color: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; font-size: 10px;">Unverified</span>';

      const towBadge = c.tow_required
        ? '<div style="margin-top: 4px; color: #dc2626; font-size: 10px; font-weight: bold;">🚨 Tow-Truck Enforcement Required</div>'
        : '';

      const popupContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 220px; font-size: 12px; color: #1e293b;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <strong style="font-family: monospace; font-size: 13px; color: #0f172a;">${c.ticket_id}</strong>
            <span style="font-weight: 700; color: ${c.severity_score >= 8 ? '#dc2626' : '#d97706'}; font-size: 11px;">
              Score: ${formatSeverityScore(c.severity_score)}/10
            </span>
          </div>
          <div style="margin-bottom: 4px;"><strong>Category:</strong> ${c.issue_type.replace(/_/g, ' ').toUpperCase()}</div>
          <div style="margin-bottom: 4px; color: #475569; font-size: 11px;">${c.address_text || 'Nagpur'}</div>
          ${c.vehicle_number ? `<div style="margin-bottom: 4px; font-mono; font-size: 11px;"><strong>Plate:</strong> ${c.vehicle_number}</div>` : ''}
          ${towBadge}
          <div style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
            ${verifiedBadge}
            <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b;">${c.status.replace(/_/g, ' ')}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        onSelectComplaint(c);
      });

      markersLayerRef.current?.addLayer(marker);

      // Add density circle for heatmap mode
      if (showHeatOverlay) {
        const radius = Math.max(100, (c.severity_score || 5) * 45);
        const heatCircle = L.circle([c.latitude, c.longitude], {
          radius,
          color: c.severity_score >= 8 ? '#ef4444' : '#f59e0b',
          fillColor: c.severity_score >= 8 ? '#ef4444' : '#f59e0b',
          fillOpacity: 0.25,
          weight: 1
        });
        heatLayerRef.current?.addLayer(heatCircle);
      }
    });
  }, [complaints, selectedComplaintId, showHeatOverlay]);

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden shadow-lg border border-slate-700">
      <div ref={mapContainerRef} className="w-full h-full min-h-[480px]" />

      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white p-3 rounded-lg text-xs space-y-1.5 shadow-xl">
        <div className="font-bold text-[11px] uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-400" /> Command Severity Key
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
          <span className="text-slate-300">Critical / Emergency (≥ 8.0)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
          <span className="text-slate-300">High / Obstruction (5.0 - 7.9)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
          <span className="text-slate-300">Standard Review (&lt; 5.0)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-slate-300">Resolved / Cleared</span>
        </div>
      </div>
    </div>
  );
};
