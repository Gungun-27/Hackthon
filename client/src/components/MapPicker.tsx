import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Search } from 'lucide-react';

// Fix Leaflet's default icon path in Vite
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationSelect: (loc: { lat: number; lng: number; address: string; accuracy: number }) => void;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLat = 21.1458, // Default Nagpur Center (Sitabuldi)
  initialLng = 79.0882,
  initialAddress = '',
  onLocationSelect
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [address, setAddress] = useState(initialAddress || 'Sitabuldi Square, Nagpur, Maharashtra');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: initialLat, lng: initialLng });
  const [accuracy, setAccuracy] = useState<number>(15);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reverse geocoding helper (with fallback to Nagpur landmarks)
  const updateAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (response.ok) {
        const data = await response.json();
        const fullAddr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}, Nagpur`;
        setAddress(fullAddr);
        onLocationSelect({ lat, lng, address: fullAddr, accuracy });
        return;
      }
    } catch {
      // Offline / fallback geocoding
    }
    const fallbackAddr = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)}), Nagpur`;
    setAddress(fallbackAddr);
    onLocationSelect({ lat, lng, address: fallbackAddr, accuracy });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Create pin marker
      const marker = L.marker([coords.lat, coords.lng], {
        icon: defaultIcon,
        draggable: true
      }).addTo(map);

      // Accuracy circle
      const circle = L.circle([coords.lat, coords.lng], {
        radius: accuracy,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(map);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        circle.setLatLng(pos);
        updateAddressFromCoords(pos.lat, pos.lng);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setCoords({ lat, lng });
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        updateAddressFromCoords(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    }

    return () => {
      // Clean map if needed
    };
  }, []);

  const handleLiveGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc } = position.coords;
        const newAcc = Math.round(acc) || 12;
        setCoords({ lat: latitude, lng: longitude });
        setAccuracy(newAcc);
        setIsLocating(false);

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
          circleRef.current.setLatLng([latitude, longitude]);
          circleRef.current.setRadius(newAcc);
        }
        updateAddressFromCoords(latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation failed:', error.message);
        // Default to Sitabuldi if denied
        alert('Could not retrieve exact GPS location. Defaulting to Central Nagpur coordinates. You can click or drag the pin directly on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleNagpurPreset = (name: string, lat: number, lng: number) => {
    setCoords({ lat, lng });
    setAddress(name);
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
    }
    onLocationSelect({ lat, lng, address: name, accuracy });
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Nagpur')}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const addr = data[0].display_name;
          setCoords({ lat, lng });
          setAddress(addr);
          if (mapInstanceRef.current && markerRef.current && circleRef.current) {
            mapInstanceRef.current.setView([lat, lng], 16);
            markerRef.current.setLatLng([lat, lng]);
            circleRef.current.setLatLng([lat, lng]);
          }
          onLocationSelect({ lat, lng, address: addr, accuracy });
          return;
        }
      }
    } catch {
      // Ignored
    }
    alert(`Could not find "${searchQuery}" in Nagpur map index. Please use the pin drop directly.`);
  };

  return (
    <div className="space-y-3">
      {/* Search & GPS Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            placeholder="Search landmark (e.g. Dharampeth, Medical Sq, Wardha Rd)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <button
          type="button"
          onClick={handleLiveGPS}
          disabled={isLocating}
          className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold px-4 py-2 rounded-lg text-xs transition border border-slate-700 disabled:opacity-50 shrink-0"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Acquiring GPS...' : 'Use Current Live GPS'}
        </button>
      </div>

      {/* Quick Landmark Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-500 font-medium flex items-center gap-1">
          <Compass className="w-3 h-3 text-slate-400" /> Fast Jump:
        </span>
        <button
          type="button"
          onClick={() => handleNagpurPreset('Variety Square, Sitabuldi, Nagpur', 21.1458, 79.0882)}
          className="bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 px-2 py-0.5 rounded transition text-[11px]"
        >
          Sitabuldi
        </button>
        <button
          type="button"
          onClick={() => handleNagpurPreset('Dharampeth Coffee House Square, Nagpur', 21.1442, 79.0621)}
          className="bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 px-2 py-0.5 rounded transition text-[11px]"
        >
          Dharampeth
        </button>
        <button
          type="button"
          onClick={() => handleNagpurPreset('Medical College Square, Nagpur', 21.1278, 79.0984)}
          className="bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 px-2 py-0.5 rounded transition text-[11px]"
        >
          Medical Square
        </button>
        <button
          type="button"
          onClick={() => handleNagpurPreset('Wardha Road, Metro Pillar 114, Nagpur', 21.1082, 79.0754)}
          className="bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 px-2 py-0.5 rounded transition text-[11px]"
        >
          Wardha Road
        </button>
        <button
          type="button"
          onClick={() => handleNagpurPreset('Residency Road, Sadar, Nagpur', 21.1610, 79.0830)}
          className="bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 px-2 py-0.5 rounded transition text-[11px]"
        >
          Sadar
        </button>
      </div>

      {/* Leaflet Map Box */}
      <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden shadow-inner h-72 w-full">
        <div ref={mapContainerRef} className="h-full w-full" />
        
        {/* Floating coordinate / accuracy badge */}
        <div className="absolute bottom-2 left-2 z-20 bg-slate-900/90 backdrop-blur-sm text-slate-200 px-2.5 py-1 rounded text-[11px] font-mono border border-slate-700 flex items-center gap-2">
          <span>Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}</span>
          <span className="text-amber-400">±{accuracy}m radius</span>
        </div>
      </div>

      {/* Selected Address Display */}
      <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-lg flex items-start gap-2 text-xs text-slate-700">
        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">Selected Incident Location:</span>
          <p className="text-slate-600 mt-0.5">{address}</p>
        </div>
      </div>
    </div>
  );
};
