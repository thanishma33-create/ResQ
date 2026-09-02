import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Ambulance,
  Package,
  Building2,
  AlertCircle,
  Compass,
  Navigation,
} from 'lucide-react';
import { formatDistance, formatETA } from '../../services/locationService';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom HTML icons with distinct colors
const createCustomIcon = (bgColor, iconHtml, pulse = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25), 0 2px 4px -2px rgba(0,0,0,0.25);
        font-size: 14px;
        ${pulse ? 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;' : ''}
      ">
        ${iconHtml}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const userIcon = createCustomIcon('#2563eb', '📍', true);
const teamIcon = createCustomIcon('#0284c7', '🚑');
const resourceIcon = createCustomIcon('#059669', '📦');
const shelterIcon = createCustomIcon('#7c3aed', '🏫');
const emergencyIcon = createCustomIcon('#dc2626', '🚨');

// Controller to smoothly animate Leaflet to current user location
const RecenterController = ({ center, zoom = 14 }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat !== undefined && center.lon !== undefined) {
      map.setView([center.lat, center.lon], zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

const NearbyMap = ({
  userLocation,
  radiusKm = 5.0,
  resources = [],
  shelters = [],
  teams = [],
  emergencies = [],
  height = '440px',
  onLocateMe,
  isLocating = false,
}) => {
  // Determine dynamic map center without hardcoded city assumptions
  const hasUserLoc = userLocation && userLocation.lat !== undefined && userLocation.lon !== undefined;
  
  const mapCenter = hasUserLoc
    ? [userLocation.lat, userLocation.lon]
    : resources[0]?.latitude && resources[0]?.longitude
    ? [resources[0].latitude, resources[0].longitude]
    : shelters[0]?.latitude && shelters[0]?.longitude
    ? [shelters[0].latitude, shelters[0].longitude]
    : [10.0, 76.5]; // Neutral default state while awaiting GPS fix

  const radiusMeters = (radiusKm || 5.0) * 1000;

  return (
    <div className="card-base p-4 space-y-3">
      {/* Map Header Controls */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-blue-600" />
          Proximity Map (Within {radiusKm} km of your position)
        </h4>

        {onLocateMe && (
          <button
            onClick={onLocateMe}
            disabled={isLocating}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Compass className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
          </button>
        )}
      </div>

      {/* Map Container */}
      <div
        className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0"
        style={{ height }}
      >
        <MapContainer
          center={mapCenter}
          zoom={hasUserLoc ? 14 : 11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {hasUserLoc && <RecenterController center={userLocation} zoom={14} />}

          {/* OpenStreetMap Tile Layer (cached by Service Worker) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />

          {/* Current User Location Marker */}
          {hasUserLoc && (
            <>
              <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <strong className="text-blue-700 block text-sm">📍 You Are Here</strong>
                    <p className="text-slate-600 mt-1 font-mono">
                      {Number(userLocation.lat).toFixed(4)}° N, {Number(userLocation.lon).toFixed(4)}° E
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Proximity Radar: {radiusKm} km radius
                    </span>
                  </div>
                </Popup>
              </Marker>

              {/* Proximity Search Radius Circle */}
              <Circle
                center={[userLocation.lat, userLocation.lon]}
                radius={radiusMeters}
                pathOptions={{
                  color: '#2563eb',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              />
            </>
          )}

          {/* Rescue Teams Markers */}
          {teams.map((t) => {
            if (!t.latitude || !t.longitude) return null;
            return (
              <Marker key={`team-${t.id}`} position={[t.latitude, t.longitude]} icon={teamIcon}>
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <strong className="text-blue-700 block">🚑 {t.name}</strong>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                      {t.status}
                    </span>
                    {t.specialty && <p className="text-slate-600 text-[11px]">Specialty: {t.specialty}</p>}
                    <p className="text-slate-700 font-semibold font-mono">
                      Distance: {formatDistance(t.distance_km)}
                    </p>
                    {t.contact_phone && (
                      <p className="text-slate-500 font-mono text-[11px]">📞 {t.contact_phone}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Resources Markers */}
          {resources.map((r) => {
            if (!r.latitude || !r.longitude) return null;
            return (
              <Marker key={`res-${r.id}`} position={[r.latitude, r.longitude]} icon={resourceIcon}>
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <strong className="text-emerald-700 block">📦 {r.name}</strong>
                    {r.location_name && <p className="text-slate-600 text-[11px]">{r.location_name}</p>}
                    <p className="text-slate-700 font-bold">
                      Available: {r.available_quantity} {r.unit || 'units'}
                    </p>
                    <p className="text-slate-700 font-mono">
                      Distance: {formatDistance(r.distance_km)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Shelters Markers */}
          {shelters.map((s) => {
            if (!s.latitude || !s.longitude) return null;
            return (
              <Marker key={`shelter-${s.id}`} position={[s.latitude, s.longitude]} icon={shelterIcon}>
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <strong className="text-purple-700 block">🏫 {s.name}</strong>
                    {s.address && <p className="text-slate-600 text-[11px]">{s.address}</p>}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.status === 'FULL'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {s.status}
                    </span>
                    <p className="text-slate-700 text-[11px]">
                      Available Beds: {s.available_capacity || (s.capacity - (s.occupied || 0))}
                    </p>
                    <p className="text-slate-700 font-mono">
                      Distance: {formatDistance(s.distance_km)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Emergencies Markers */}
          {emergencies.map((e) => {
            if (!e.latitude || !e.longitude) return null;
            return (
              <Marker key={`em-${e.id}`} position={[e.latitude, e.longitude]} icon={emergencyIcon}>
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <strong className="text-red-700 block">🚨 #{e.id} {e.emergency_type}</strong>
                    {e.address && <p className="text-slate-600 text-[11px]">{e.address}</p>}
                    <p className="text-slate-700 font-mono">
                      Distance: {formatDistance(e.distance_km)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <span className="font-semibold text-slate-800 text-[11px]">Markers:</span>
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> You Are Here
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> 🚑 Rescue Team
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> 📦 Resource
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> 🏫 Shelter
          </span>
        </div>
      </div>
    </div>
  );
};

export default NearbyMap;
