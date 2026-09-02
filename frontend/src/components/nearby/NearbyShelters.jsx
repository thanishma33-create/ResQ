import React, { useState } from 'react';
import {
  Building2,
  Users,
  HeartPulse,
  Utensils,
  Phone,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import DistanceBadge from './DistanceBadge';

const NearbyShelters = ({ shelters = [], onSelectShelter }) => {
  const [sortBy, setSortBy] = useState('nearest'); // 'nearest' | 'capacity'

  const sortedShelters = [...shelters].sort((a, b) => {
    if (sortBy === 'capacity') {
      return (b.available_capacity || 0) - (a.available_capacity || 0);
    }
    return (a.distance_km || 0) - (b.distance_km || 0);
  });

  return (
    <div className="card-base p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            Relief Shelters Near You ({shelters.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Emergency accommodation, safe camps, and medical support centers in proximity.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          <span className="text-[11px] text-slate-500 px-1 font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Sort:
          </span>
          <button
            onClick={() => setSortBy('nearest')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              sortBy === 'nearest'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nearest First
          </button>
          <button
            onClick={() => setSortBy('capacity')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              sortBy === 'capacity'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Most Capacity
          </button>
        </div>
      </div>

      {/* Shelters List */}
      {shelters.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">No active shelters within search radius.</p>
          <p className="text-[11px] text-slate-500">Try expanding your search radius to locate regional relief centers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedShelters.map((shelter) => {
            const isFull = shelter.status === 'FULL' || shelter.available_capacity <= 0;
            const occupancyPct = shelter.capacity > 0
              ? Math.min(100, Math.round(((shelter.occupied || 0) / shelter.capacity) * 100))
              : 0;

            return (
              <div
                key={shelter.id}
                className={`p-4 rounded-xl border transition-all shadow-xs space-y-3 flex flex-col justify-between ${
                  isFull
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : 'border-slate-200 bg-white hover:border-purple-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{shelter.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{shelter.address}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        isFull
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isFull ? 'Camp Full' : 'Open'}
                    </span>
                  </div>

                  {/* Capacity Ribbon */}
                  <div className="mt-3 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">
                        Occupancy: <strong>{shelter.occupied || 0}</strong> / {shelter.capacity} beds
                      </span>
                      <span className={isFull ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                        {shelter.available_capacity || 0} Spaces Free
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          occupancyPct > 90 ? 'bg-red-500' : occupancyPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <DistanceBadge distanceKm={shelter.distance_km} etaMinutes={shelter.eta_minutes} />
                    </div>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {shelter.has_medical && (
                      <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 font-semibold">
                        <HeartPulse className="w-3 h-3" /> Medical Clinic
                      </span>
                    )}
                    {shelter.has_food && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 font-semibold">
                        <Utensils className="w-3 h-3" /> Food Camp
                      </span>
                    )}
                  </div>

                  {shelter.contact_phone && (
                    <a
                      href={`tel:${shelter.contact_phone}`}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> {shelter.contact_phone}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NearbyShelters;
