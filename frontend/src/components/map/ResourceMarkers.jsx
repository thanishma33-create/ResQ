import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const resourceIcon = L.divIcon({
  className: 'custom-resource-marker',
  html: `
    <div style="width: 28px; height: 28px; border-radius: 9999px; background: #d97706; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-size: 13px;">
      📦
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const ResourceMarkers = ({ resources = [] }) => {
  return (
    <>
      {resources.map((r) =>
        r.latitude && r.longitude ? (
          <Marker key={`res-${r.id}`} position={[r.latitude, r.longitude]} icon={resourceIcon}>
            <Popup>
              <div className="p-1 space-y-1 text-slate-900 text-xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
                  <span className="font-bold text-slate-900">{r.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                    {r.available_quantity} {r.unit}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{r.location_name}</p>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </>
  );
};

export default ResourceMarkers;
