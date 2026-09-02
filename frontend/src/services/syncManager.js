import axiosClient from '../api/axiosClient';
import {
  getQueuedSOS,
  getQueuedEmergencies,
  getQueuedEvidence,
  markItemSynced,
  markItemFailed,
  setLastSyncTime,
} from './offlineQueue';

let isSyncing = false;
const syncListeners = new Set();

export const subscribeSyncEvents = (callback) => {
  syncListeners.add(callback);
  return () => syncListeners.delete(callback);
};

const notifySyncListeners = (status, details = {}) => {
  syncListeners.forEach((fn) => {
    try {
      fn(status, details);
    } catch (e) {
      console.error('Error in sync listener:', e);
    }
  });
};

/**
 * Synchronize all queued offline data with the backend
 */
export const syncAllQueues = async (options = {}) => {
  if (isSyncing) return { success: false, reason: 'ALREADY_SYNCING' };
  if (!navigator.onLine) {
    notifySyncListeners('OFFLINE');
    return { success: false, reason: 'NO_NETWORK' };
  }

  isSyncing = true;
  notifySyncListeners('SYNC_START');

  let successCount = 0;
  let failedCount = 0;
  const results = [];

  try {
    // 1. Sync SOS Beacons
    const sosList = await getQueuedSOS();
    const pendingSOS = sosList.filter((s) => s.status !== 'SYNCED');

    for (const sos of pendingSOS) {
      try {
        const payload = {
          name: sos.name,
          phone: sos.phone,
          latitude: sos.latitude,
          longitude: sos.longitude,
          people: sos.people,
          message: sos.message,
          medical_needed: sos.medical_needed,
          trapped: sos.trapped,
          client_sos_id: sos.client_sos_id,
          client_id: sos.client_sos_id,
        };

        const res = await axiosClient.post('/api/sos/', payload);
        const serverEmergencyId = res.data.emergency_id;

        await markItemSynced('sosQueue', sos.client_sos_id, serverEmergencyId);
        successCount++;
        results.push({ type: 'SOS', id: sos.client_sos_id, server_id: serverEmergencyId, status: 'SUCCESS' });
      } catch (err) {
        console.error(`Failed to sync SOS ${sos.client_sos_id}:`, err);
        const errMsg = err.response?.data?.detail || err.message || 'Sync failed';
        await markItemFailed('sosQueue', sos.client_sos_id, errMsg);
        failedCount++;
        results.push({ type: 'SOS', id: sos.client_sos_id, error: errMsg, status: 'FAILED' });
      }
    }

    // 2. Sync Emergency Requests
    const emergencyList = await getQueuedEmergencies();
    const pendingEmg = emergencyList.filter((e) => e.status !== 'SYNCED');

    for (const emg of pendingEmg) {
      try {
        const payload = {
          client_id: emg.client_id,
          emergency_type: emg.emergency_type,
          description: emg.description,
          latitude: emg.latitude,
          longitude: emg.longitude,
          address: emg.address,
          people_affected: emg.people_affected,
          children: emg.children,
          elderly: emg.elderly,
          pregnant_persons: emg.pregnant_persons,
          disabled_persons: emg.disabled_persons,
          injured_persons: emg.injured_persons,
          medical_required: emg.medical_required,
          trapped: emg.trapped,
          required_resources: emg.required_resources,
          disaster_id: emg.disaster_id,
          reporter_name: emg.reporter_name,
          reporter_phone: emg.reporter_phone,
        };

        const res = await axiosClient.post('/api/emergencies/', payload);
        const serverEmergencyId = res.data.id;

        await markItemSynced('emergencyQueue', emg.client_id, serverEmergencyId);
        successCount++;
        results.push({ type: 'EMERGENCY', id: emg.client_id, server_id: serverEmergencyId, status: 'SUCCESS' });
      } catch (err) {
        console.error(`Failed to sync Emergency ${emg.client_id}:`, err);
        const errMsg = err.response?.data?.detail || err.message || 'Sync failed';
        await markItemFailed('emergencyQueue', emg.client_id, errMsg);
        failedCount++;
        results.push({ type: 'EMERGENCY', id: emg.client_id, error: errMsg, status: 'FAILED' });
      }
    }

    // 3. Sync Evidence Photos
    const evidenceList = await getQueuedEvidence();
    const pendingEvidence = evidenceList.filter((ev) => ev.status !== 'SYNCED');

    for (const ev of pendingEvidence) {
      try {
        if (ev.file_blob && ev.emergency_id) {
          const formData = new FormData();
          formData.append('file', ev.file_blob, ev.file_name || 'evidence.jpg');
          if (ev.description) formData.append('description', ev.description);
          if (ev.resolution_notes) formData.append('resolution_notes', ev.resolution_notes);

          await axiosClient.post(`/api/evidence/${ev.emergency_id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          await markItemSynced('evidenceQueue', ev.id, ev.emergency_id);
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to sync Evidence item ${ev.id}:`, err);
        await markItemFailed('evidenceQueue', ev.id, err.message);
        failedCount++;
      }
    }

    const timestamp = new Date().toISOString();
    await setLastSyncTime(timestamp);

    notifySyncListeners('SYNC_COMPLETE', {
      successCount,
      failedCount,
      timestamp,
      results,
    });

    return {
      success: true,
      syncedCount: successCount,
      failedCount,
      timestamp,
      results,
    };
  } catch (globalErr) {
    console.error('Fatal error during sync run:', globalErr);
    notifySyncListeners('SYNC_ERROR', { error: globalErr.message });
    return { success: false, error: globalErr.message };
  } finally {
    isSyncing = false;
  }
};

/**
 * Register online listener and background sync
 */
export const initSyncManager = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('🌐 Network restored. Triggering automatic background sync...');
      syncAllQueues();
    });

    // Check on startup if online and items in queue
    if (navigator.onLine) {
      setTimeout(() => {
        syncAllQueues();
      }, 3000);
    }
  }

  // Register Background Sync if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync.register('resq-emergency-sync');
      })
      .catch((err) => {
        console.log('Background Sync not supported or permission denied:', err);
      });
  }
};
