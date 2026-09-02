import React from 'react';
import { MapPinOff, AlertTriangle, RefreshCw, Navigation } from 'lucide-react';

const LocationPermission = ({
  permissionStatus,
  error,
  onRetry,
  isLocating,
  onManualCoords,
}) => {
  if (permissionStatus === 'granted' && !error) return null;

  return (
    <div className="w-full p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 flex-shrink-0">
          {permissionStatus === 'denied' ? (
            <MapPinOff className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
            {permissionStatus === 'denied'
              ? 'GPS Location Access Blocked'
              : 'Location Permission Required for Proximity Search'}
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            {permissionStatus === 'denied'
              ? 'Browser location access was denied. Please allow location permissions in your browser address bar or enter your coordinates manually to find emergency help near you.'
              : error || 'Please allow GPS location access to display relief centers, supplies, and response units near your real position.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
        <button
          type="button"
          onClick={onRetry}
          disabled={isLocating}
          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
        >
          {isLocating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Acquiring GPS...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Enable GPS Location</span>
            </>
          )}
        </button>

        {onManualCoords && (
          <button
            type="button"
            onClick={onManualCoords}
            className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
          >
            Enter Coordinates Manually
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationPermission;
