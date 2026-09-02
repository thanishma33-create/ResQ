import React, { useState } from 'react';
import {
  Package,
  Droplets,
  Utensils,
  Pill,
  HeartPulse,
  Flame,
  Shield,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Navigation,
} from 'lucide-react';
import DistanceBadge from './DistanceBadge';

const getCategoryIcon = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('water')) return <Droplets className="w-5 h-5 text-blue-600" />;
  if (cat.includes('food')) return <Utensils className="w-5 h-5 text-amber-600" />;
  if (cat.includes('med') || cat.includes('first_aid')) return <HeartPulse className="w-5 h-5 text-red-600" />;
  if (cat.includes('boat') || cat.includes('rescue')) return <Shield className="w-5 h-5 text-indigo-600" />;
  if (cat.includes('ambulance') || cat.includes('vehicle')) return <Truck className="w-5 h-5 text-emerald-600" />;
  return <Package className="w-5 h-5 text-slate-600" />;
};

const NearbyResources = ({ resources = [], onRequestResource }) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Filter out depleted resources (available_quantity <= 0)
  const availableResources = resources.filter((r) => r.available_quantity > 0);

  const categories = ['ALL', ...new Set(availableResources.map((r) => r.category.toUpperCase()))];

  const filtered = selectedCategory === 'ALL'
    ? availableResources
    : availableResources.filter((r) => r.category.toUpperCase() === selectedCategory);

  return (
    <div className="card-base p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Resources & Supplies Near You ({filtered.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified emergency stockpiles, rations, and medical inventory within your search radius.
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
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
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
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Package className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">No resources available within current radius.</p>
          <p className="text-[11px] text-slate-500">Try expanding your search radius to 10 km or 25 km.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.location_name}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    Available
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">In Stock</span>
                    <span className="font-bold text-blue-700">
                      {item.available_quantity} <span className="text-[10px] font-normal text-slate-500">{item.unit || 'units'}</span>
                    </span>
                  </div>

                  <DistanceBadge distanceKm={item.distance_km} etaMinutes={item.eta_minutes} />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono">
                  Category: {item.category.toUpperCase()}
                </span>

                {onRequestResource && (
                  <button
                    onClick={() => onRequestResource(item)}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
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
