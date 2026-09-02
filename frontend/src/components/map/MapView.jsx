import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import OfflineMapStatus from './OfflineMapStatus';
import EmergencyMarkers from './EmergencyMarkers';
import TeamMarkers from './TeamMarkers';
import ShelterMarkers from './ShelterMarkers';
import ResourceMarkers from './ResourceMarkers';
import { useOffline } from '../../context/OfflineContext';

// Custom icons for volunteers, disasters, weather, and user
const createIcon = (bgColor, iconChar, isPulse = false) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        ${
          isPulse
            ? `<div style="position: absolute; inset: -3px; border-radius: 9999px; background: ${bgColor}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
        }
        <div style="width: 28px; height: 28px; border-radius: 9999px; background: ${bgColor}; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-size: 13px;">
          ${iconChar}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const userIcon = createIcon('#2563eb', '📍', true);
const volunteerIcon = createIcon('#059669', '🟢');
const disasterIcon = createIcon('#dc2626', '⚠️', true);
const weatherIcon = createIcon('#0284c7', '🌧️');

// Map Recenter Helper Component
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

const MapView = ({
  center = null,
  zoom = 12,
  emergencies = [],
  teams = [],
  volunteers = [],
  resources = [],
  shelters = [],
  disasters = [],
  weatherAlerts = [],
  userLocation = null,
  activeFilters = {
    emergencies: true,
    teams: true,
    volunteers: true,
    resources: true,
    shelters: true,
    disasters: true,
    weather: true,
  },
  height = '500px',
  selectedEntity = null,
}) => {
  const { isOnline, cacheEntities, getCachedEntities } = useOffline();
  const [cachedData, setCachedData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // When online, cache loaded data to IndexedDB
  useEffect(() => {
    if (isOnline) {
      if (emergencies.length > 0) cacheEntities('map_emergencies', emergencies);
      if (teams.length > 0) cacheEntities('map_teams', teams);
      if (shelters.length > 0) cacheEntities('map_shelters', shelters);
      if (resources.length > 0) cacheEntities('map_resources', resources);
      if (disasters.length > 0) cacheEntities('map_disasters', disasters);
      setLastUpdated(new Date().toISOString());
    } else {
      // When offline, load cached entities if props are empty
      const loadOfflineSnapshots = async () => {
        try {
          const [cachedEm, cachedTm, cachedSh, cachedRs, cachedDs] = await Promise.all([
            getCachedEntities('map_emergencies'),
            getCachedEntities('map_teams'),
            getCachedEntities('map_shelters'),
            getCachedEntities('map_resources'),
            getCachedEntities('map_disasters'),
          ]);

          setCachedData({
            emergencies: cachedEm?.data || [],
            teams: cachedTm?.data || [],
            shelters: cachedSh?.data || [],
            resources: cachedRs?.data || [],
            disasters: cachedDs?.data || [],
            cached_at: cachedEm?.cached_at || null,
          });
          if (cachedEm?.cached_at) {
            setLastUpdated(cachedEm.cached_at);
          }
        } catch (e) {
          console.error('Error reading offline map entities:', e);
        }
      };
      loadOfflineSnapshots();
    }
  }, [isOnline, emergencies, teams, shelters, resources, disasters, cacheEntities, getCachedEntities]);

  // Display data: prefer live props if available, fallback to cachedData if offline
  const displayEmergencies = emergencies.length > 0 ? emergencies : cachedData?.emergencies || [];
  const displayTeams = teams.length > 0 ? teams : cachedData?.teams || [];
  const displayShelters = shelters.length > 0 ? shelters : cachedData?.shelters || [];
  const displayResources = resources.length > 0 ? resources : cachedData?.resources || [];
  const displayDisasters = disasters.length > 0 ? disasters : cachedData?.disasters || [];

  const mapCenter = selectedEntity
    ? [selectedEntity.latitude, selectedEntity.longitude]
    : center && center[0] && center[1]
    ? center
    : userLocation?.lat && userLocation?.lon
    ? [userLocation.lat, userLocation.lon]
    : displayEmergencies[0]?.latitude && displayEmergencies[0]?.longitude
    ? [displayEmergencies[0].latitude, displayEmergencies[0].longitude]
    : [10.0, 76.5];

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs relative">
      {/* Offline/Online Map Indicator */}
      <OfflineMapStatus lastUpdated={lastUpdated} isCached={!isOnline} />

      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <RecenterMap center={mapCenter} zoom={zoom} />

        {/* Standard OpenStreetMap Tile Layer (cached offline via Service Worker) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {/* User GPS Pin */}
        {userLocation && userLocation.lat && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
            <Popup>
              <div className="p-1 space-y-1 text-slate-900 text-xs">
                <span className="font-bold text-xs text-blue-600 block">
                  📍 Your Location (GPS)
                </span>
                <p className="text-[11px] text-slate-500 font-mono">
                  {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 1. Emergency Markers */}
        {activeFilters.emergencies && (
          <EmergencyMarkers emergencies={displayEmergencies} userLocation={userLocation} />
        )}

        {/* 2. Rescue Team Markers */}
        {activeFilters.teams && <TeamMarkers teams={displayTeams} />}

        {/* 3. Shelter Markers */}
        {activeFilters.shelters && <ShelterMarkers shelters={displayShelters} />}

        {/* 4. Resource Markers */}
        {activeFilters.resources && <ResourceMarkers resources={displayResources} />}

        {/* 5. Volunteers Markers */}
        {activeFilters.volunteers &&
          volunteers.map((v) => (
            <Marker key={`vol-${v.id}`} position={[v.latitude, v.longitude]} icon={volunteerIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-slate-900 text-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
                    <span className="font-bold text-xs text-slate-900">{v.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      {v.availability}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">📞 {v.phone}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {v.skills?.map((s, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 6. Disaster Hazard Zones (Perimeter Circle + Pin) */}
        {activeFilters.disasters &&
          displayDisasters.map((d) => (
            <React.Fragment key={`disaster-${d.id}`}>
              <Circle
                center={[d.latitude, d.longitude]}
                radius={2800}
                pathOptions={{
                  color: '#dc2626',
                  fillColor: '#ef4444',
                  fillOpacity: 0.15,
                  dashArray: '6, 6',
                }}
              />
              <Marker position={[d.latitude, d.longitude]} icon={disasterIcon}>
                <Popup>
                  <div className="p-1 space-y-1 text-slate-900 text-xs">
                    <span className="font-bold text-xs text-red-700 block border-b border-slate-200 pb-1">
                      ⚠️ {d.name} ({d.type?.toUpperCase()})
                    </span>
                    <p className="text-xs text-slate-600">{d.description}</p>
                    <p className="text-[10px] font-bold text-red-600">Risk: {d.risk_level?.toUpperCase()}</p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

        {/* 7. Weather Alert Hazards */}
        {activeFilters.weather &&
          weatherAlerts.map((w, idx) => (
            <Marker key={`weather-${idx}`} position={[w.latitude, w.longitude]} icon={weatherIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-slate-900 text-xs">
                  <span className="font-bold text-xs text-blue-700 block border-b border-slate-200 pb-1">
                    🌧️ {w.location_name}: {w.alert_level}
                  </span>
                  <p className="text-xs text-slate-600">{w.description}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Rainfall: {w.rainfall_mm}mm | Wind: {w.wind_speed_kmh}km/h
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
