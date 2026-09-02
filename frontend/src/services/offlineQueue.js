import { dbGet, dbGetAll, dbPut, dbDelete, dbCount } from './indexedDB';

// Unique client token generators for idempotency
export const generateClientSosId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SOS-2026-${timestamp}-${randomPart}`;
};

export const generateClientId = (prefix = 'EMG') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-2026-${timestamp}-${randomPart}`;
};

/**
 * Enqueue an offline SOS distress beacon
 */
export const enqueueSOS = async (sosData) => {
  const client_sos_id = sosData.client_sos_id || generateClientSosId();
  const record = {
    client_sos_id,
    user_id: sosData.user_id || null,
    name: sosData.name || 'Anonymous Victim',
    phone: sosData.phone || '',
    latitude: sosData.latitude !== undefined && sosData.latitude !== null ? Number(sosData.latitude) : null,
    longitude: sosData.longitude !== undefined && sosData.longitude !== null ? Number(sosData.longitude) : null,
    gps_accuracy: sosData.gps_accuracy || null,
    people: Number(sosData.people || 1),
    message: sosData.message || 'EMERGENCY SOS: Immediate rescue needed',
    medical_needed: Boolean(sosData.medical_needed),
    trapped: Boolean(sosData.trapped),
    status: 'QUEUED_OFFLINE', // QUEUED_OFFLINE | SYNCING | SYNCED | FAILED
    retry_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    server_emergency_id: null,
    error_message: null,
  };

  await dbPut('sosQueue', record);
  return record;
};

/**
 * Enqueue an offline Emergency Incident report
 */
export const enqueueEmergency = async (emergencyData) => {
  const client_id = emergencyData.client_id || generateClientId('EMG');
  const record = {
    client_id,
    emergency_type: emergencyData.emergency_type || 'flood_trapped',
    description: emergencyData.description || 'Offline emergency dispatch request',
    latitude: emergencyData.latitude !== undefined && emergencyData.latitude !== null ? Number(emergencyData.latitude) : null,
    longitude: emergencyData.longitude !== undefined && emergencyData.longitude !== null ? Number(emergencyData.longitude) : null,
    address: emergencyData.address || 'GPS Coordinates Location',
    people_affected: Number(emergencyData.people_affected || 1),
    children: Number(emergencyData.children || 0),
    elderly: Number(emergencyData.elderly || 0),
    pregnant_persons: Number(emergencyData.pregnant_persons || 0),
    disabled_persons: Number(emergencyData.disabled_persons || 0),
    injured_persons: Number(emergencyData.injured_persons || 0),
    medical_required: Boolean(emergencyData.medical_required),
    trapped: Boolean(emergencyData.trapped),
    required_resources: emergencyData.required_resources || [],
    disaster_id: emergencyData.disaster_id || null,
    reporter_name: emergencyData.reporter_name || '',
    reporter_phone: emergencyData.reporter_phone || '',
    status: 'QUEUED_OFFLINE',
    retry_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    server_emergency_id: null,
    error_message: null,
  };

  await dbPut('emergencyQueue', record);
  return record;
};

/**
 * Enqueue an offline Evidence item
 */
export const enqueueEvidence = async (evidenceData) => {
  const record = {
    emergency_id: evidenceData.emergency_id,
    description: evidenceData.description || '',
    resolution_notes: evidenceData.resolution_notes || '',
    file_blob: evidenceData.file_blob || null,
    file_name: evidenceData.file_name || 'evidence.jpg',
    status: 'QUEUED_OFFLINE',
    created_at: new Date().toISOString(),
  };

  await dbPut('evidenceQueue', record);
  return record;
};

/**
 * Get all queued SOS records
 */
export const getQueuedSOS = async () => {
  return dbGetAll('sosQueue');
};

/**
 * Get all queued Emergency records
 */
export const getQueuedEmergencies = async () => {
  return dbGetAll('emergencyQueue');
};

/**
 * Get all queued Evidence records
 */
export const getQueuedEvidence = async () => {
  return dbGetAll('evidenceQueue');
};

/**
 * Get aggregated queue count
 */
export const getTotalQueuedCount = async () => {
  const [sosList, emgList, evList] = await Promise.all([
    dbGetAll('sosQueue'),
    dbGetAll('emergencyQueue'),
    dbGetAll('evidenceQueue'),
  ]);

  const pendingSos = sosList.filter((s) => s.status !== 'SYNCED').length;
  const pendingEmg = emgList.filter((e) => e.status !== 'SYNCED').length;
  const pendingEv = evList.filter((ev) => ev.status !== 'SYNCED').length;

  return pendingSos + pendingEmg + pendingEv;
};

/**
 * Mark item as SYNCED
 */
export const markItemSynced = async (storeName, key, serverId) => {
  const item = await dbGet(storeName, key);
  if (item) {
    item.status = 'SYNCED';
    item.server_emergency_id = serverId;
    item.updated_at = new Date().toISOString();
    await dbPut(storeName, item);
  }
};

/**
 * Mark item as FAILED with error message
 */
export const markItemFailed = async (storeName, key, errorMessage) => {
  const item = await dbGet(storeName, key);
  if (item) {
    item.status = 'FAILED';
    item.retry_count = (item.retry_count || 0) + 1;
    item.error_message = errorMessage || 'Sync transmission failed';
    item.updated_at = new Date().toISOString();
    await dbPut(storeName, item);
  }
};

/**
 * Cache entity snapshots (emergencies, shelters, teams, resources) with timestamp
 */
export const cacheEntitiesSnapshot = async (entityKey, dataList) => {
  const record = {
    key: entityKey,
    data: dataList,
    cached_at: new Date().toISOString(),
    count: Array.isArray(dataList) ? dataList.length : 1,
  };
  await dbPut('cachedEntities', record);
};

/**
 * Retrieve cached entity snapshot
 */
export const getCachedEntitiesSnapshot = async (entityKey) => {
  return dbGet('cachedEntities', entityKey);
};

/**
 * Last sync time management
 */
export const setLastSyncTime = async (timestamp = new Date().toISOString()) => {
  await dbPut('syncStatus', { key: 'last_sync_time', value: timestamp });
};

export const getLastSyncTime = async () => {
  const record = await dbGet('syncStatus', 'last_sync_time');
  return record ? record.value : null;
};
