import axiosClient from '../api/axiosClient';
import { cacheEntitiesSnapshot, getCachedEntitiesSnapshot } from './offlineQueue';

/**
 * Fetches authoritative nearby assistance from backend (with offline IndexedDB caching).
 * Calls GET /locations/nearby with user's real GPS latitude and longitude.
 *
 * @param {number} latitude - User GPS latitude
 * @param {number} longitude - User GPS longitude
 * @param {number} radiusKm - Proximity search radius (1, 3, 5, 10, 25 km)
 */
export const getNearbyAssistance = async (latitude, longitude, radiusKm = 5.0) => {
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    throw new Error('Valid latitude and longitude are required for nearby assistance lookup.');
  }

  const latNum = parseFloat(latitude);
  const lonNum = parseFloat(longitude);
  const radiusNum = parseFloat(radiusKm);

  try {
    const res = await axiosClient.get('/api/locations/nearby', {
      params: {
        latitude: latNum,
        longitude: lonNum,
        radius_km: radiusNum,
      },
    });

    const data = res.data;
    // Cache snapshot in IndexedDB for offline access
    await cacheEntitiesSnapshot('nearby_assistance_snapshot', data);
    return { data, isOfflineCached: false, cachedAt: new Date().toISOString() };
  } catch (err) {
    console.warn('Online nearby assistance query failed, attempting IndexedDB offline cache:', err.message);
    const cached = await getCachedEntitiesSnapshot('nearby_assistance_snapshot');
    if (cached && cached.data) {
      return {
        data: cached.data,
        isOfflineCached: true,
        cachedAt: cached.cached_at,
      };
    }
    throw err;
  }
};

/**
 * Retrieves only nearby relief shelters
 */
export const getNearbyShelters = async (latitude, longitude, radiusKm = 5.0) => {
  const result = await getNearbyAssistance(latitude, longitude, radiusKm);
  return {
    shelters: result.data?.shelters || [],
    isOfflineCached: result.isOfflineCached,
    cachedAt: result.cachedAt,
  };
};

/**
 * Retrieves only nearby resources
 */
export const getNearbyResources = async (latitude, longitude, radiusKm = 5.0) => {
  const result = await getNearbyAssistance(latitude, longitude, radiusKm);
  return {
    resources: result.data?.resources || [],
    isOfflineCached: result.isOfflineCached,
    cachedAt: result.cachedAt,
  };
};

/**
 * Retrieves only nearby rescue teams
 */
export const getNearbyRescueTeams = async (latitude, longitude, radiusKm = 5.0) => {
  const result = await getNearbyAssistance(latitude, longitude, radiusKm);
  return {
    rescue_teams: result.data?.rescue_teams || [],
    isOfflineCached: result.isOfflineCached,
    cachedAt: result.cachedAt,
  };
};

export default {
  getNearbyAssistance,
  getNearbyShelters,
  getNearbyResources,
  getNearbyRescueTeams,
};
