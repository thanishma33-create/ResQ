import React, { useState } from 'react';
import {
  Package,
  Droplets,
  Utensils,
  HeartPulse,
  Shield,
  Truck,
  Shirt,
  Navigation,
  CheckCircle2,
  LifeBuoy,
} from 'lucide-react';
import DistanceBadge from './DistanceBadge';

const getCategoryIcon = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('water')) return <Droplets className="w-5 h-5 text-blue-600" />;
  if (cat.includes('food')) return <Utensils className="w-5 h-5 text-amber-600" />;
  if (cat.includes('med') || cat.includes('first_aid')) return <HeartPulse className="w-5 h-5 text-red-600" />;
  if (cat.includes('boat') || cat.includes('life_jacket')) return <LifeBuoy className="w-5 h-5 text-sky-600" />;
  if (cat.includes('rescue') || cat.includes('equipment')) return <Shield className="w-5 h-5 text-indigo-600" />;
  if (cat.includes('ambulance') || cat.includes('vehicle')) return <Truck className="w-5 h-5 text-emerald-600" />;
  if (cat.includes('blanket') || cat.includes('cloth')) return <Shirt className="w-5 h-5 text-purple-600" />;
  return <Package className="w-5 h-5 text-slate-600" />;
};

const NearbyResources = ({
  resources = [],
  onRequestResource,
  onExpandRadius,
  radiusKm = 5,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Filter out depleted items (available_quantity <= 0) and sort by distance
  const availableResources = resources
    .filter((r) => (r.available_quantity || 0) > 0)
    .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

  const categories = ['ALL', ...new Set(availableResources.map((r) => (r.category || 'general').toUpperCase()))];

  const filtered = selectedCategory === 'ALL'
    ? availableResources
    : availableResources.filter((r) => (r.category || 'general').toUpperCase() === selectedCategory);

  return (
    <div className="card-base p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            Resources & Emergency Supplies Near You ({filtered.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified emergency rations, potable water, medical kits, and rescue gear within your search radius.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
          <Package className="w-8 h-8 text-slate-400 mx-auto" />
          <div>
            <p className="text-xs font-bold text-slate-700">📦 No resources found within {radiusKm} km.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              No available emergency supply depots found within the selected proximity.
            </p>
          </div>
          {onExpandRadius && (
            <button
              onClick={onExpandRadius}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Expand Search Radius</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(item.category || item.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.location_name}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    AVAILABLE
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Available Stock</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {item.available_quantity} <span className="text-[11px] font-normal text-slate-500">{item.unit || 'units'}</span>
                    </span>
                  </div>

                  <DistanceBadge distanceKm={item.distance_km} etaMinutes={item.eta_minutes} />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono">
                  {(item.category || item.type || 'GENERAL').toUpperCase()}
                </span>

                {onRequestResource && (
                  <button
                    onClick={() => onRequestResource(item)}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                  >
                    Request Supply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyResources;
