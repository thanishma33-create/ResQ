import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  enqueueSOS,
  enqueueEmergency,
  enqueueEvidence,
  getQueuedSOS,
  getQueuedEmergencies,
  getQueuedEvidence,
  getTotalQueuedCount,
  cacheEntitiesSnapshot,
  getCachedEntitiesSnapshot,
  getLastSyncTime,
} from '../services/offlineQueue';
import { syncAllQueues, initSyncManager, subscribeSyncEvents } from '../services/syncManager';

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [networkQuality, setNetworkQuality] = useState(() => (navigator.onLine ? 'online' : 'offline'));
  const [queuedCount, setQueuedCount] = useState(0);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTimeState] = useState(null);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Refresh queue counts and list from IndexedDB
  const refreshQueue = useCallback(async () => {
    try {
      const [sosList, emgList, count, syncTime] = await Promise.all([
        getQueuedSOS(),
        getQueuedEmergencies(),
        getTotalQueuedCount(),
        getLastSyncTime(),
      ]);

      const activeItems = [
        ...sosList.map((s) => ({ ...s, queueType: 'SOS' })),
        ...emgList.map((e) => ({ ...e, queueType: 'EMERGENCY' })),
      ];

      setOfflineQueue(activeItems);
      setQueuedCount(count);
      if (syncTime) setLastSyncTimeState(syncTime);
    } catch (err) {
      console.error('Error refreshing offline queue:', err);
    }
  }, []);

  // Initialize network listeners & sync engine
  useEffect(() => {
    initSyncManager();

    const handleOnline = () => {
      setIsOnline(true);
      setNetworkQuality('online');
      refreshQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkQuality('offline');
      refreshQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load of queue
    refreshQueue();

    // Listen to sync manager events
    const unsubscribe = subscribeSyncEvents((event, details) => {
      if (event === 'SYNC_START') {
        setIsSyncing(true);
        setNetworkQuality('syncing');
      } else if (event === 'SYNC_COMPLETE') {
        setIsSyncing(false);
        setNetworkQuality(navigator.onLine ? 'online' : 'offline');
        setLastSyncResult(details);
        if (details?.timestamp) setLastSyncTimeState(details.timestamp);
        refreshQueue();
      } else if (event === 'SYNC_ERROR') {
        setIsSyncing(false);
        setNetworkQuality(navigator.onLine ? 'online' : 'offline');
        refreshQueue();
      }
    });

    // Latency & health check
    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        setNetworkQuality('offline');
        return;
      }
      const start = Date.now();
      try {
        await fetch('http://127.0.0.1:8000/api/health', { method: 'HEAD', cache: 'no-store' });
        const latency = Date.now() - start;
        setIsOnline(true);
        setNetworkQuality(latency > 1800 ? 'weak' : isSyncing ? 'syncing' : 'online');
      } catch {
        setNetworkQuality('weak');
      }
    }, 15000);

    // PWA Install prompt listener
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(interval);
      unsubscribe();
    };
  }, [refreshQueue]);

  // Offline SOS Enqueue Action
  const queueSOS = useCallback(async (sosData) => {
    const item = await enqueueSOS(sosData);
    await refreshQueue();
    return item;
  }, [refreshQueue]);

  // Offline Emergency Request Enqueue Action
  const queueEmergency = useCallback(async (emergencyData) => {
    const item = await enqueueEmergency(emergencyData);
    await refreshQueue();
    return item;
  }, [refreshQueue]);

  // Offline Evidence Enqueue Action
  const queueEvidence = useCallback(async (evidenceData) => {
    const item = await enqueueEvidence(evidenceData);
    await refreshQueue();
    return item;
  }, [refreshQueue]);

  // Manual Trigger to Sync
  const syncOfflineQueue = useCallback(async () => {
    const res = await syncAllQueues();
    await refreshQueue();
    return res;
  }, [refreshQueue]);

  // Cache entity snapshots for offline map & views
  const cacheEntities = useCallback(async (key, data) => {
    await cacheEntitiesSnapshot(key, data);
  }, []);

  const getCachedEntities = useCallback(async (key) => {
    return getCachedEntitiesSnapshot(key);
  }, []);

  // Trigger PWA Install
  const promptPWAInstall = useCallback(async () => {
    if (!deferredInstallPrompt) return false;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setDeferredInstallPrompt(null);
    return outcome === 'accepted';
  }, [deferredInstallPrompt]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        networkQuality,
        queuedCount,
        offlineQueue,
        isSyncing,
        lastSyncTime,
        lastSyncResult,
        queueSOS,
        queueEmergency,
        queueEvidence,
        syncOfflineQueue,
        refreshQueue,
        cacheEntities,
        getCachedEntities,
        canInstallPWA: Boolean(deferredInstallPrompt),
        isAppInstalled,
        promptPWAInstall,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
