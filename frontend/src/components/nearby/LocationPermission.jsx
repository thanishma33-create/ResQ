import React from 'react';
import { MapPin, MapPinOff, AlertTriangle, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

const LocationPermission = ({
  permissionStatus = 'prompt',
  error,
  onRetry,
  isLocating = false,
}) => {
  if (permissionStatus === 'granted' && !error) {
    return (
      <div className="w-full p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              📍 Location detected
            </h4>
            <p className="text-xs text-emerald-800">
              Your real device GPS coordinates are active and finding nearby assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50 border border-blue-200 text-slate-800 space-y-4 shadow-sm">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          {permissionStatus === 'denied' ? (
            <MapPinOff className="w-5 h-5" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-bold text-slate-900">
            📍 Find Help Near Me
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We need your current location to find nearby:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-medium text-slate-700">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="font-bold">✓</span> Emergency Shelters
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="font-bold">✓</span> Food & Water
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="font-bold">✓</span> Medical Resources
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="font-bold">✓</span> Rescue Teams
            </div>
          </div>
        </div>
      </div>

      {permissionStatus === 'denied' && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>
            <strong>Location Permission Required:</strong> Please allow location access in your browser settings to find nearby shelters and resources.
          </span>
        </div>
      )}

      {error && permissionStatus !== 'denied' && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="pt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          disabled={isLocating}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
        >
          {isLocating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Detecting your current location...</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5" />
              <span>Use My Current Location</span>
            </>
          )}
        </button>

        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          Coordinates remain private & encrypted
        </span>
      </div>
    </div>
  );
};

export default LocationPermission;
