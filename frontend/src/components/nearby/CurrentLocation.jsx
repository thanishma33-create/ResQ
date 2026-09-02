import React, { useState, useEffect } from 'react';
import {
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  AlertCircle,
  Radio,
} from 'lucide-react';
import LocationAccuracy from './LocationAccuracy';

const RADIUS_OPTIONS = [
  { value: 1.0, label: '1 km' },
  { value: 3.0, label: '3 km' },
  { value: 5.0, label: '5 km (Default)' },
  { value: 10.0, label: '10 km' },
  { value: 25.0, label: '25 km' },
];

const CurrentLocation = ({
  location,
  locationName = 'Current GPS Location',
  isLocating,
  error,
  lastUpdated,
  onRefresh,
  isLiveTracking,
  onToggleLiveTracking,
  radius,
  onRadiusChange,
}) => {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdated) {
        setSecondsAgo(Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000)));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const formatTimeAgo = (secs) => {
    if (secs < 5) return 'Just now';
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ago`;
  };

  const hasFix = location?.lat !== undefined && location?.lon !== undefined;
  const latStr = hasFix ? Number(location.lat).toFixed(4) : '--';
  const lonStr = hasFix ? Number(location.lon).toFixed(4) : '--';

  return (
    <div className="card-base p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: GPS Details */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs">
            <MapPin className={`w-6 h-6 ${isLocating ? 'animate-bounce' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">
                {locationName}
              </h3>
              {hasFix ? (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  GPS Active
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Awaiting Fix
                </span>
              )}

              {location?.accuracy && <LocationAccuracy accuracy={location.accuracy} />}
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs font-mono text-slate-600">
              <span>
                <strong>Lat:</strong> {latStr}° N
              </span>
              <span>•</span>
              <span>
                <strong>Lon:</strong> {lonStr}° E
              </span>
              <span>•</span>
              <span className="text-slate-400 font-sans text-[11px]">
                Updated {formatTimeAgo(secondsAgo)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {onToggleLiveTracking && (
            <button
              onClick={onToggleLiveTracking}
              type="button"
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                isLiveTracking
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{isLiveTracking ? 'Live Tracking ON' : 'Live Track'}</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLocating}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Acquiring GPS...' : 'Refresh My Location'}</span>
          </button>
        </div>
      </div>

      {/* Error notice if location permission had error */}
      {error && !hasFix && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Radius Filter Ribbon */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <span>Search Radius for Assistance:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {RADIUS_OPTIONS.map((opt) => {
            const isSelected = radius === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onRadiusChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurrentLocation;
