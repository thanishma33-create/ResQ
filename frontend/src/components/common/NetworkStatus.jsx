import React from 'react';
import { Link } from 'react-router-dom';
import { useOffline } from '../../context/OfflineContext';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, HardDrive, CheckCircle2 } from 'lucide-react';

const NetworkStatus = () => {
  const {
    isOnline,
    networkQuality,
    queuedCount,
    syncOfflineQueue,
    isSyncing,
    lastSyncResult,
  } = useOffline();

  return (
    <div className="flex items-center gap-2">
      {isSyncing ? (
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs animate-pulse"
          title="Uploading queued emergency data to server"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>SYNCING — Uploading Requests...</span>
        </span>
      ) : networkQuality === 'online' ? (
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
          title="Connected to Live ResQ Emergency Network"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>ONLINE</span>
        </span>
      ) : networkQuality === 'weak' ? (
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
          title="High latency network connection"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>WEAK CONNECTION</span>
        </span>
      ) : (
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-xs"
          title="Internet unavailable. Emergency data will be stored locally in IndexedDB"
        >
          <WifiOff className="w-3.5 h-3.5 text-red-600" />
          <span>OFFLINE — Stored Locally</span>
        </span>
      )}

      {queuedCount > 0 && (
        <Link
          to="/offline-queue"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors shadow-xs"
          title="View Offline Queue in IndexedDB"
        >
          <HardDrive className="w-3.5 h-3.5 text-amber-700" />
          <span>{queuedCount} Queued</span>
        </Link>
      )}
    </div>
  );
};

export default NetworkStatus;
