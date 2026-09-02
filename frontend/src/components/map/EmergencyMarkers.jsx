import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { formatEmergencyType } from '../../utils/formatters';
import { haversineDistance, estimateETA } from '../../utils/geoUtils';
import { ArrowRight } from 'lucide-react';

const createEmergencyIcon = (severity) => {
  const isCritical = severity === 'CRITICAL';
  const bgColor = isCritical ? '#dc2626' : '#d97706';

  return L.divIcon({
    className: 'custom-emergency-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        ${
          isCritical
            ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: ${bgColor}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
        }
        <div style="width: 28px; height: 28px; border-radius: 9999px; background: ${bgColor}; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 13px;">
          🚨
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const EmergencyMarkers = ({ emergencies = [], userLocation = null }) => {
  return (
    <>
      {emergencies.map((em) => (
        <Marker
          key={`em-${em.id || em.client_id}`}
          position={[em.latitude, em.longitude]}
          icon={createEmergencyIcon(em.severity)}
        >
          <Popup>
            <div className="p-1 space-y-1.5 max-w-xs text-slate-900 text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
                <span className="font-bold text-xs text-slate-900">
                  #{em.id || 'QUEUED'} {formatEmergencyType(em.emergency_type)}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    em.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {em.severity}
                </span>
              </div>

              <p className="text-slate-600 leading-snug">{em.description}</p>

              <div className="text-[11px] text-slate-500 space-y-0.5">
                <p>📍 {em.address || `${em.latitude.toFixed(3)}, ${em.longitude.toFixed(3)}`}</p>
                <p>👥 {em.people_affected || 1} people affected</p>
                {userLocation && (
                  <p className="text-blue-600 font-medium">
                    📏 {haversineDistance(userLocation.lat, userLocation.lon, em.latitude, em.longitude)} km away (~{estimateETA(haversineDistance(userLocation.lat, userLocation.lon, em.latitude, em.longitude))} mins)
                  </p>
                )}
              </div>

              {em.id && (
                <Link
                  to={`/emergencies/${em.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1"
                >
                  Open Details & Assign <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default EmergencyMarkers;
