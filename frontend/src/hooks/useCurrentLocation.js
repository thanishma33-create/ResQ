import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentPosition, reverseGeocodeLocation } from '../services/locationService';

export const useCurrentLocation = () => {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('resq_last_user_location');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [locationName, setLocationName] = useState(() => {
    try {
      return localStorage.getItem('resq_last_location_name') || 'Current GPS Location';
    } catch {
      return 'Current GPS Location';
    }
  });

  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unavailable' | 'timeout'
  const [lastUpdated, setLastUpdated] = useState(() => Date.now());
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  const watchIdRef = useRef(null);
  const lastGeocodeTimeRef = useRef(0);

  // Check initial permission status if browser supports Permissions API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((res) => {
          setPermissionStatus(res.state);
          res.onchange = () => setPermissionStatus(res.state);
        })
        .catch(() => {});
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    setIsLocating(true);
    setError(null);

    try {
      const pos = await getCurrentPosition();
      const updated = {
        lat: pos.lat,
        lon: pos.lon,
        latitude: pos.lat,
        longitude: pos.lon,
        accuracy: pos.accuracy,
        timestamp: pos.timestamp,
      };

      setLocation(updated);
      setLastUpdated(Date.now());
      setPermissionStatus('granted');
      localStorage.setItem('resq_last_user_location', JSON.stringify(updated));

      // Asynchronously resolve human-readable location name
      reverseGeocodeLocation(pos.lat, pos.lon)
        .then((name) => {
          if (name) {
            setLocationName(name);
            localStorage.setItem('resq_last_location_name', name);
          }
        })
        .catch(() => {});

      return updated;
    } catch (err) {
      console.warn('Current GPS location retrieval error:', err.message);
      setError(err.message);
      if (err.code === 1) {
        setPermissionStatus('denied');
      } else if (err.code === 2) {
        setPermissionStatus('unavailable');
      } else if (err.code === 3) {
        setPermissionStatus('timeout');
      }
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Live Location Tracker (watchPosition with movement threshold)
  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLiveTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const updated = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 10),
          timestamp: pos.timestamp || Date.now(),
        };

        setLocation(updated);
        setLastUpdated(Date.now());
        setPermissionStatus('granted');
        localStorage.setItem('resq_last_user_location', JSON.stringify(updated));

        // Throttle reverse-geocoding (at most once every 60 seconds)
        const now = Date.now();
        if (now - lastGeocodeTimeRef.current > 60000) {
          lastGeocodeTimeRef.current = now;
          reverseGeocodeLocation(pos.coords.latitude, pos.coords.longitude)
            .then((name) => {
              if (name) {
                setLocationName(name);
                localStorage.setItem('resq_last_location_name', name);
              }
            })
            .catch(() => {});
        }
      },
      (err) => {
        console.warn('Live location watch error:', err.message);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }, []);

  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);
  }, []);

  const toggleLiveTracking = useCallback(() => {
    if (isLiveTracking) {
      stopLiveTracking();
    } else {
      startLiveTracking();
    }
  }, [isLiveTracking, startLiveTracking, stopLiveTracking]);

  // Initial location fetch on mount
  useEffect(() => {
    refreshLocation();
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [refreshLocation]);

  return {
    location,
    locationName,
    isLocating,
    error,
    permissionStatus,
    lastUpdated,
    isLiveTracking,
    refreshLocation,
    startLiveTracking,
    stopLiveTracking,
    toggleLiveTracking,
    setLocation,
  };
};

export default useCurrentLocation;
