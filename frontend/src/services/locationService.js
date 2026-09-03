import { getNearbyAssistance, reverseGeocode } from './locationApi';
import {
  getNearbyAssistance as getNearbyAssistanceSvc,
  getNearbyShelters as getNearbySheltersSvc,
  getNearbyResources as getNearbyResourcesSvc,
  getNearbyRescueTeams as getNearbyRescueTeamsSvc,
} from './nearbyService';

export const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates haversine distance between two coordinates in kilometers
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }
  try {
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((EARTH_RADIUS_KM * c).toFixed(2));
  } catch {
    return 0;
  }
};

/**
 * Formats distance into human-friendly string (e.g., "350 m", "1.4 km")
 */
export const formatDistance = (distKm) => {
  if (distKm === undefined || distKm === null || isNaN(distKm)) return '--';
  const num = typeof distKm === 'number' ? distKm : parseFloat(distKm);
  if (num < 1.0) {
    return `${Math.round(num * 1000)} m`;
  }
  return `${num.toFixed(1)} km`;
};

/**
 * Formats estimated time of arrival (ETA)
 */
export const formatETA = (etaMinutes) => {
  if (etaMinutes === undefined || etaMinutes === null || isNaN(etaMinutes)) return '--';
  const mins = Math.round(etaMinutes);
  if (mins <= 1) return 'Immediate (< 2 min)';
  if (mins < 60) return `~${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `~${hrs}h ${rem}m`;
};

/**
 * Estimates ETA in minutes given distance in km and urban emergency vehicle speed
 */
export const estimateETA = (distKm, speedKmh = 35) => {
  if (!distKm || distKm <= 0) return null;
  const hours = distKm / speedKmh;
  const mins = hours * 60 * 1.25;
  return parseFloat(Math.max(mins, 1.0).toFixed(1));
};

/**
 * Gets real current user GPS coordinates via browser Geolocation API
 * Uses enableHighAccuracy: true, timeout: 10000ms, maximumAge: 0
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Your browser does not support location services.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 10),
          timestamp: position.timestamp || Date.now(),
        });
      },
      (error) => {
        let msg = 'Unable to determine your current location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please allow location access in your browser settings to find nearby shelters and resources.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Unable to determine your current location. Please check GPS/location services and try again.';
            break;
          case error.TIMEOUT:
            msg = 'Location detection timed out. Please try again.';
            break;
          default:
            msg = error.message || msg;
        }
        const err = new Error(msg);
        err.code = error.code;
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

export const getCurrentPosition = getCurrentLocation;

/**
 * Re-exports for nearby assistance services and reverse geocoding
 */
export const fetchNearbyAssistance = getNearbyAssistanceSvc || getNearbyAssistance;
export const getNearbyShelters = getNearbySheltersSvc;
export const getNearbyResources = getNearbyResourcesSvc;
export const getNearbyRescueTeams = getNearbyRescueTeamsSvc;
export const reverseGeocodeLocation = reverseGeocode;
