import React from 'react';
import { Navigation, Clock } from 'lucide-react';
import { formatDistance, formatETA } from '../../services/locationService';

const DistanceBadge = ({ distanceKm, etaMinutes, showETA = true, size = 'sm' }) => {
  const distNum = typeof distanceKm === 'number' ? distanceKm : parseFloat(distanceKm);

  // Color gradient based on distance
  let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
  if (distNum < 1.0) {
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
  } else if (distNum > 5.0) {
    badgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
  }

  const isSmall = size === 'sm';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono font-medium ${badgeColor} ${
          isSmall ? 'text-[11px]' : 'text-xs'
        }`}
      >
        <Navigation className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-blue-600`} />
        {formatDistance(distNum)}
      </span>

      {showETA && etaMinutes !== undefined && etaMinutes !== null && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 font-medium ${
            isSmall ? 'text-[11px]' : 'text-xs'
          }`}
        >
          <Clock className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-600`} />
          {formatETA(etaMinutes)}
        </span>
      )}
    </div>
  );
};

export default DistanceBadge;
