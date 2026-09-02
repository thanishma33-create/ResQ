import axiosClient from '../api/axiosClient';
import { cacheEntitiesSnapshot, getCachedEntitiesSnapshot } from './offlineQueue';

/**
 * Fetches authoritative nearby assistance from backend (with offline IndexedDB caching)
 * Uses real GPS latitude and longitude provided by the browser or user.
 */
export const getNearbyAssistance = async (latitude, longitude, radiusKm = 5.0) => {
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    throw new Error('Valid latitude and longitude are required for nearby assistance lookup.');
  }

  try {
    const res = await axiosClient.get('/api/locations/nearby', {
      params: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius_km: parseFloat(radiusKm),
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
 * Convenience method to retrieve only nearby resources
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
 * Convenience method to retrieve only nearby shelters
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
 * Convenience method to retrieve only nearby rescue teams
 */
export const getNearbyRescueTeams = async (latitude, longitude, radiusKm = 5.0) => {
  const result = await getNearbyAssistance(latitude, longitude, radiusKm);
  return {
    rescue_teams: result.data?.rescue_teams || [],
    isOfflineCached: result.isOfflineCached,
    cachedAt: result.cachedAt,
  };
};

/**
 * Resolves a human-readable location name for coordinates via reverse geocoding
 * Safely falls back to formatted GPS string if offline or unavailable.
 */
export const reverseGeocode = async (latitude, longitude) => {
  if (latitude === undefined || longitude === undefined) return 'Unknown Location';

  const latNum = parseFloat(latitude);
  const lonNum = parseFloat(longitude);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lonNum}&zoom=14&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'ResQ-Disaster-Relief-App/1.0',
        },
        signal: AbortSignal.timeout(4000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const locality = addr.suburb || addr.neighbourhood || addr.city_district || addr.village || addr.town || addr.city || '';
      const region = addr.state_district || addr.state || '';

      if (locality && region) {
        return `${locality}, ${region}`;
      } else if (locality || region) {
        return locality || region;
      }
    }
  } catch {
    // Network offline or timeout -> fallback safely to formatted GPS
  }

  return `GPS: ${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`;
};
