import { openDB } from 'idb';

const DB_NAME = 'resq_offline_db';
const DB_VERSION = 1;

let dbPromise = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 1. SOS Queue: stores offline 1-click SOS beacons
        if (!db.objectStoreNames.contains('sosQueue')) {
          const sosStore = db.createObjectStore('sosQueue', { keyPath: 'client_sos_id' });
          sosStore.createIndex('status', 'status', { unique: false });
          sosStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // 2. Emergency Queue: stores detailed emergency dispatches logged offline
        if (!db.objectStoreNames.contains('emergencyQueue')) {
          const emStore = db.createObjectStore('emergencyQueue', { keyPath: 'client_id' });
          emStore.createIndex('status', 'status', { unique: false });
          emStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // 3. Evidence Queue: stores offline photo/notes evidence for resolutions
        if (!db.objectStoreNames.contains('evidenceQueue')) {
          const evStore = db.createObjectStore('evidenceQueue', { keyPath: 'id', autoIncrement: true });
          evStore.createIndex('emergency_id', 'emergency_id', { unique: false });
        }

        // 4. Cached Locations: stores recent GPS fixes and known rescue depots
        if (!db.objectStoreNames.contains('cachedLocations')) {
          db.createObjectStore('cachedLocations', { keyPath: 'id' });
        }

        // 5. Cached Entities: stores offline snapshots of shelters, teams, resources, emergencies
        if (!db.objectStoreNames.contains('cachedEntities')) {
          db.createObjectStore('cachedEntities', { keyPath: 'key' });
        }

        // 6. Sync Status: metadata on sync runs, network health, last sync time
        if (!db.objectStoreNames.contains('syncStatus')) {
          db.createObjectStore('syncStatus', { keyPath: 'key' });
        }

        // 7. App Settings: offline map settings, PWA flags, user profile cache
        if (!db.objectStoreNames.contains('appSettings')) {
          db.createObjectStore('appSettings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};

// Generic store operations helper
export const dbGet = async (storeName, key) => {
  const db = await getDB();
  return db.get(storeName, key);
};

export const dbGetAll = async (storeName) => {
  const db = await getDB();
  return db.getAll(storeName);
};

export const dbPut = async (storeName, val) => {
  const db = await getDB();
  return db.put(storeName, val);
};

export const dbDelete = async (storeName, key) => {
  const db = await getDB();
  return db.delete(storeName, key);
};

export const dbClear = async (storeName) => {
  const db = await getDB();
  return db.clear(storeName);
};

export const dbCount = async (storeName) => {
  const db = await getDB();
  return db.count(storeName);
};
