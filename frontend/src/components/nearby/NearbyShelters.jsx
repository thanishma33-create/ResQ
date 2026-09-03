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
  Zap,
  Accessibility,
  Droplets,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import DistanceBadge from './DistanceBadge';

const NearbyShelters = ({
  shelters = [],
  onSelectShelter,
  onViewOnMap,
  onExpandRadius,
  radiusKm = 5,
}) => {
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
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <div>
            <p className="text-xs font-bold text-slate-700">🏫 No shelters found within {radiusKm} km.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              There are currently no active relief camps registered within your selected search radius.
            </p>
          </div>
          {onExpandRadius && (
            <button
              onClick={onExpandRadius}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Expand Search Radius</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedShelters.map((shelter) => {
            const isFull = shelter.status === 'FULL' || shelter.available_capacity <= 0;
            const occupancyPct = shelter.capacity > 0
              ? Math.min(100, Math.round(((shelter.occupied || 0) / shelter.capacity) * 100))
              : 0;

            const googleMapsUrl = shelter.latitude && shelter.longitude
              ? `https://www.google.com/maps/dir/?api=1&destination=${shelter.latitude},${shelter.longitude}`
              : null;

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
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        {shelter.name}
                      </h4>
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
                        {shelter.available_capacity || 0} Available
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

                  {/* Facility Amenities Checklist */}
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <HeartPulse className="w-3 h-3 text-red-500" />
                      Medical Facility: <strong>{shelter.has_medical ? 'Yes' : 'Basic'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-amber-500" />
                      Food: <strong>{shelter.has_food ? 'Available' : 'Limited'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-500" />
                      Water: <strong>Available</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      Electricity: <strong>Available</strong>
                    </span>
                  </div>
                </div>

                {/* Footer Controls & Directions */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
                  {shelter.contact_phone ? (
                    <a
                      href={`tel:${shelter.contact_phone}`}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1 font-mono"
                    >
                      <Phone className="w-3 h-3" /> {shelter.contact_phone}
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">Location ID: #{shelter.id}</span>
                  )}

                  <div className="flex items-center gap-2">
                    {onViewOnMap && (
                      <button
                        onClick={() => onViewOnMap(shelter)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3" /> View on Map
                      </button>
                    )}

                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3 text-purple-600" />
                        <span>Get Directions</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    )}
                  </div>
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
