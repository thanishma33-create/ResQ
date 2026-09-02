import React from 'react';

const MapLegend = ({ activeFilters = {}, onToggleFilter }) => {
  const legendItems = [
    { key: 'emergencies', label: 'Emergencies', color: 'bg-red-50 text-red-700 border-red-200', icon: '🔴' },
    { key: 'teams', label: 'Rescue Teams', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🔵' },
    { key: 'volunteers', label: 'Volunteers', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🟢' },
    { key: 'resources', label: 'Resources', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🟠' },
    { key: 'shelters', label: 'Shelters', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🟣' },
    { key: 'disasters', label: 'Disaster Zones', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: '⚠️' },
    { key: 'weather', label: 'Weather Alerts', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: '🌧️' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs text-xs">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
        Map Layers:
      </span>
      {legendItems.map((item) => {
        const isActive = activeFilters[item.key] !== false;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onToggleFilter && onToggleFilter(item.key)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              isActive
                ? `${item.color} font-semibold shadow-xs`
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MapLegend;
