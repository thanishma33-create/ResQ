import React from 'react';
import { useOffline } from '../../context/OfflineContext';
import { Wifi, WifiOff, HardDrive, RefreshCw } from 'lucide-react';

const OfflineMapStatus = ({ lastUpdated, isCached = false }) => {
  const { isOnline, networkQuality, isSyncing } = useOffline();

  return (
    <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
      {isOnline ? (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>Live GIS Map</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/95 backdrop-blur-md border border-amber-300 shadow-sm text-xs font-bold text-amber-800">
          <HardDrive className="w-3.5 h-3.5 text-amber-600" />
          <span>Offline — Cached Map Tiles</span>
        </div>
      )}

      {lastUpdated && (
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] text-white font-mono shadow-xs">
          <span>Updated: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}
    </div>
  );
};

export default OfflineMapStatus;
