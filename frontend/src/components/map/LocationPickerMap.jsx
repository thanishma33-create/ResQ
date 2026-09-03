import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  MapPin,
  Check,
  Crosshair,
  Navigation,
} from 'lucide-react';
import { getCurrentPosition, reverseGeocodeLocation } from '../../services/locationService';

// Fix default Leaflet marker assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom Pin Icon
const pinIcon = L.divIcon({
  className: 'custom-picker-pin',
  html: `
    <div style="
      position: relative;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: #ef4444;
        opacity: 0.35;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #dc2626;
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      ">
        📍
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Controller to invalidate size on mount & smoothly fly to coords
const MapController = ({ center, zoom = 14 }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size in case modal just animated into view
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    if (center && center[0] !== undefined && center[1] !== undefined) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }

    return () => clearTimeout(timer);
  }, [center, zoom, map]);

  return null;
};

// Map click listener to pick coordinates
const MapClickListener = ({ onLocationPick }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationPick(lat, lng);
    },
  });
  return null;
};

const LocationPickerMap = ({
  latitude,
  longitude,
  onChange,
  height = '260px',
  zoom = 14,
  showAddress = true,
}) => {
  const [currentGps, setCurrentGps] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedPos, setSelectedPos] = useState(() => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lon)) {
      return [lat, lon];
    }
    return null;
  });
  const [resolvedAddress, setResolvedAddress] = useState('');
  const markerRef = useRef(null);

  // Sync with prop changes
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lon)) {
      setSelectedPos([lat, lon]);
    }
  }, [latitude, longitude]);

  // Handle location update and reverse geocoding
  const handleLocationUpdate = async (lat, lon) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLon = parseFloat(lon.toFixed(6));
    setSelectedPos([roundedLat, roundedLon]);

    try {
      const addr = await reverseGeocodeLocation(roundedLat, roundedLon);
      setResolvedAddress(addr);
      if (onChange) {
        onChange({
          latitude: roundedLat,
          longitude: roundedLon,
          address: addr,
        });
      }
    } catch {
      if (onChange) {
        onChange({
          latitude: roundedLat,
          longitude: roundedLon,
        });
      }
    }
  };

  // Get current GPS position and fly to it
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const pos = await getCurrentPosition();
      setCurrentGps({ lat: pos.lat, lon: pos.lon, accuracy: pos.accuracy });
      await handleLocationUpdate(pos.lat, pos.lon);
    } catch (err) {
      console.warn('GPS location retrieval error in LocationPickerMap:', err.message);
    } finally {
      setIsLocating(false);
    }
  };

  // Default initial map center if no position selected yet
  const defaultCenter = selectedPos || [9.9312, 76.2673];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>Click Map or Use GPS to Set Exact Location</span>
        </label>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Compass className={`w-3 h-3 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Acquiring GPS...' : '📍 Use My GPS Location'}</span>
        </button>
      </div>

      {/* Leaflet Map Container */}
      <div
        className="w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner relative z-0"
        style={{ height }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />

          <MapClickListener onLocationPick={handleLocationUpdate} />

          {selectedPos && <MapController center={selectedPos} zoom={zoom} />}

          {/* Selected Pin Marker */}
          {selectedPos && (
            <Marker
              ref={markerRef}
              position={selectedPos}
              icon={pinIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  handleLocationUpdate(pos.lat, pos.lng);
                },
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="text-red-700 block font-bold">📍 Incident Location</strong>
                  <p className="font-mono text-[11px] text-slate-600 mt-0.5">
                    {selectedPos[0].toFixed(5)}, {selectedPos[1].toFixed(5)}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    (Drag pin or click map to move)
                  </span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* GPS Accuracy Circle if current GPS is available */}
          {currentGps && (
            <Circle
              center={[currentGps.lat, currentGps.lon]}
              radius={Math.max(currentGps.accuracy || 20, 20)}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.12,
                weight: 1.5,
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Selected Coordinates & Address Footer */}
      {selectedPos && (
        <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-semibold text-slate-800">Lat:</span> {selectedPos[0].toFixed(5)}
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-800">Lon:</span> {selectedPos[1].toFixed(5)}
          </div>
          {resolvedAddress && showAddress && (
            <span className="text-blue-700 font-medium truncate max-w-[200px]" title={resolvedAddress}>
              📍 {resolvedAddress}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPickerMap;
