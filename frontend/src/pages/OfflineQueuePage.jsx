import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOffline } from '../context/OfflineContext';
import {
  getQueuedSOS,
  getQueuedEmergencies,
  getQueuedEvidence,
  markItemSynced,
} from '../services/offlineQueue';
import { dbDelete } from '../services/indexedDB';
import { formatEmergencyType, formatDate, formatRelativeTime } from '../utils/formatters';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  FileText,
  Camera,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

const OfflineQueuePage = () => {
  const {
    isOnline,
    networkQuality,
    queuedCount,
    isSyncing,
    lastSyncTime,
    lastSyncResult,
    syncOfflineQueue,
  } = useOffline();

  const [sosList, setSosList] = useState([]);
  const [emergencyList, setEmergencyList] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, PENDING, SYNCED, FAILED

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sList, eList, evList] = await Promise.all([
        getQueuedSOS(),
        getQueuedEmergencies(),
        getQueuedEvidence(),
      ]);
      setSosList(sList || []);
      setEmergencyList(eList || []);
      setEvidenceList(evList || []);
    } catch (err) {
      console.error('Error loading offline queue page data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isSyncing, lastSyncResult]);

  const handleDeleteItem = async (storeName, id) => {
    if (!window.confirm('Delete this item from local offline storage?')) return;
    await dbDelete(storeName, id);
    loadData();
  };

  const handleManualSync = async () => {
    await syncOfflineQueue();
    loadData();
  };

  const allItems = [
    ...sosList.map((item) => ({ ...item, type: 'SOS', storeName: 'sosQueue', idKey: item.client_sos_id })),
    ...emergencyList.map((item) => ({ ...item, type: 'EMERGENCY', storeName: 'emergencyQueue', idKey: item.client_id })),
    ...evidenceList.map((item) => ({ ...item, type: 'EVIDENCE', storeName: 'evidenceQueue', idKey: item.id })),
  ];

  const pendingItems = allItems.filter((i) => i.status !== 'SYNCED');
  const syncedItems = allItems.filter((i) => i.status === 'SYNCED');
  const failedItems = allItems.filter((i) => i.status === 'FAILED');

  const filteredItems = allItems.filter((i) => {
    if (filterTab === 'PENDING') return i.status !== 'SYNCED';
    if (filterTab === 'SYNCED') return i.status === 'SYNCED';
    if (filterTab === 'FAILED') return i.status === 'FAILED';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Offline Emergency Dispatch Queue
            </h1>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {isOnline ? 'Online — Auto Sync Active' : 'Offline Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            IndexedDB client queue storing distress beacons, offline requests, and photo evidence without data loss.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-xs"
            title="Reload Local Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline || pendingItems.length === 0}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Uploading Queued Data...' : 'Sync Queued Items Now'}</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-base p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Pending Sync</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{pendingItems.length} Items</div>
            <span className="text-[11px] text-slate-400">Stored safely in browser IndexedDB</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="card-base p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Successfully Synced</span>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">{syncedItems.length} Delivered</div>
            <span className="text-[11px] text-slate-400">Delivered to command center</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="card-base p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Last Sync Run</span>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'No sync recorded'}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {lastSyncTime ? formatDate(lastSyncTime) : 'Waiting for network'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'ALL', label: `All Items (${allItems.length})` },
          { key: 'PENDING', label: `Pending Sync (${pendingItems.length})` },
          { key: 'SYNCED', label: `Synced (${syncedItems.length})` },
          { key: 'FAILED', label: `Failed Retries (${failedItems.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterTab === tab.key
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue Items Table */}
      {isLoading ? (
        <div className="card-base p-8 text-center text-slate-500 text-xs">
          Loading offline storage records...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card-base p-10 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Offline Items in this View</h3>
          <p className="text-xs text-slate-500">All emergency records are synchronized or no offline records exist.</p>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Client ID & Type</th>
                  <th className="py-3 px-4">Details / Situation</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Queued Time</th>
                  <th className="py-3 px-4">Sync Status</th>
                  <th className="py-3 px-4">Server Emergency ID</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => {
                  const isSynced = item.status === 'SYNCED';
                  const isFailed = item.status === 'FAILED';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          {item.type === 'SOS' ? (
                            <span className="w-6 h-6 rounded bg-red-50 text-red-600 flex items-center justify-center">
                              <Flame className="w-3.5 h-3.5" />
                            </span>
                          ) : item.type === 'EMERGENCY' ? (
                            <span className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                              <FileText className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                              <Camera className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-900 block">
                              {item.idKey || item.client_sos_id || item.client_id || `#${item.id}`}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">
                              {item.type} • {item.emergency_type ? formatEmergencyType(item.emergency_type) : 'Incident'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-800 font-medium truncate">
                          {item.message || item.description || item.resolution_notes || 'Emergency Report'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.name || item.reporter_name ? `By: ${item.name || item.reporter_name}` : ''} {item.phone ? `(${item.phone})` : ''} • {item.people || item.people_affected || 1} victims
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {item.latitude && item.longitude ? (
                          <span>
                            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Attached to Incident</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatRelativeTime(item.created_at)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isSynced ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            SYNCHRONIZED
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="w-3 h-3" />
                            RETRY FAILED ({item.retry_count || 1})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3" />
                            QUEUED OFFLINE
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        {item.server_emergency_id ? (
                          <Link
                            to={`/emergencies/${item.server_emergency_id}`}
                            className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>#{item.server_emergency_id}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Pending Upload</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteItem(item.storeName, item.idKey)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                          title="Delete from local database"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineQueuePage;
