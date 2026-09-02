import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const teamIcon = L.divIcon({
  className: 'custom-team-marker',
  html: `
    <div style="width: 28px; height: 28px; border-radius: 9999px; background: #2563eb; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-size: 13px;">
      🚑
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const TeamMarkers = ({ teams = [] }) => {
  return (
    <>
      {teams.map((t) => (
        <Marker key={`team-${t.id}`} position={[t.latitude, t.longitude]} icon={teamIcon}>
          <Popup>
            <div className="p-1 space-y-1 text-slate-900 text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-900">{t.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  {t.status}
                </span>
              </div>
              <p className="text-slate-600">Leader: <strong className="text-slate-800">{t.team_leader}</strong></p>
              <p className="text-slate-500 font-mono text-[11px]">📞 {t.contact_phone}</p>
              <p className="text-slate-500 text-[11px]">Specialty: {t.specialty}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default TeamMarkers;
