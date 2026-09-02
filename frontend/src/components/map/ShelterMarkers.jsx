import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const shelterIcon = L.divIcon({
  className: 'custom-shelter-marker',
  html: `
    <div style="width: 28px; height: 28px; border-radius: 9999px; background: #9333ea; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-size: 13px;">
      🏫
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const ShelterMarkers = ({ shelters = [] }) => {
  return (
    <>
      {shelters.map((s) => (
        <Marker key={`shelter-${s.id}`} position={[s.latitude, s.longitude]} icon={shelterIcon}>
          <Popup>
            <div className="p-1 space-y-1 text-slate-900 text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-900">{s.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                  {s.occupied} / {s.capacity} beds
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">{s.address}</p>
              <p className="text-emerald-700 font-medium text-[11px]">
                Available Capacity: {Math.max(0, s.capacity - s.occupied)} beds
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default ShelterMarkers;
