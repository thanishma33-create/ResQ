import React from 'react';
import { User, Truck, Package, Building2, AlertTriangle } from 'lucide-react';

const MapLegend = () => {
  return (
    <div className="p-3 bg-white/95 backdrop-blur-xs rounded-xl border border-slate-200 shadow-sm text-xs space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
        Map Legend
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
            ●
          </span>
          <span className="text-slate-700 font-medium text-[11px]">You Are Here</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[9px]">
            📦
          </span>
          <span className="text-slate-700 font-medium text-[11px]">Resources</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-purple-600 flex items-center justify-center text-white text-[9px]">
            🏫
          </span>
          <span className="text-slate-700 font-medium text-[11px]">Relief Camps</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center text-white text-[9px]">
            🚑
          </span>
          <span className="text-slate-700 font-medium text-[11px]">Rescue Units</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
