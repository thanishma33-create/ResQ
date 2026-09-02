import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { getCurrentPosition, haversineDistance, estimateETA } from '../utils/geoUtils';
import MapView from '../components/map/MapView';
import Loading from '../components/common/Loading';
import ErrorState from '../components/common/ErrorState';
import SeverityBadge from '../components/common/SeverityBadge';
import StatusBadge from '../components/common/StatusBadge';
import { formatEmergencyType } from '../utils/formatters';
import {
  Compass,
  MapPin,
  Ambulance,
  Building2,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LocationIntelPage = () => {
  const [userPos, setUserPos] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [emergencies, setEmergencies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGeospatialEntities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [emRes, teamsRes, sheltersRes, resRes] = await Promise.all([
        axiosClient.get('/api/emergencies/'),
        axiosClient.get('/api/teams/'),
        axiosClient.get('/api/shelters/'),
        axiosClient.get('/api/resources/'),
      ]);

      setEmergencies(emRes.data);
      setTeams(teamsRes.data);
      setShelters(sheltersRes.data);
      setResources(resRes.data);
    } catch (err) {
      console.error('Failed to fetch geospatial data:', err);
      setError('Failed to load geospatial telemetry from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocation = () => {
    setIsLocating(true);
    getCurrentPosition()
      .then((pos) => {
        setUserPos(pos);
        setIsLocating(false);
      })
      .catch((err) => {
        console.warn('GPS location request error:', err.message);
        setIsLocating(false);
      });
  };

  useEffect(() => {
    refreshLocation();
    fetchGeospatialEntities();
  }, []);

  const curLat = userPos?.lat;
  const curLon = userPos?.lon;

  // Calculate nearest team
  const nearestTeams = [...teams]
    .map((t) => {
      const dist = curLat !== undefined && curLon !== undefined ? haversineDistance(curLat, curLon, t.latitude, t.longitude) : null;
      return {
        ...t,
        distance: dist,
        eta: dist !== null ? estimateETA(dist) : null,
      };
    })
    .sort((a, b) => (a.distance || 999) - (b.distance || 999));

  // Calculate nearest shelter
  const nearestShelters = [...shelters]
    .map((s) => {
      const dist = curLat !== undefined && curLon !== undefined ? haversineDistance(curLat, curLon, s.latitude, s.longitude) : null;
      return {
        ...s,
        distance: dist,
        eta: dist !== null ? estimateETA(dist) : null,
      };
    })
    .sort((a, b) => (a.distance || 999) - (b.distance || 999));

  // Calculate nearby emergencies
  const nearbyEmergencies = [...emergencies]
    .map((em) => {
      const dist = curLat !== undefined && curLon !== undefined ? haversineDistance(curLat, curLon, em.latitude, em.longitude) : null;
      return {
        ...em,
        distance: dist,
        eta: dist !== null ? estimateETA(dist) : null,
      };
    })
    .sort((a, b) => (a.distance || 999) - (b.distance || 999));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              GPS & Geospatial Intelligence
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              Proximity Radar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Haversine distance calculation, dynamic urban speed ETA modeling, and resource proximity rings.
          </p>
        </div>

        <button
          onClick={refreshLocation}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          Recalibrate GPS
        </button>
      </div>

      {/* Current Position Banner */}
      <div className="card-base p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold block">
              Reference Base Location (GPS Fix)
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {userPos?.city || userPos?.locationName || 'Current GPS Operational Position'}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Latitude: {curLat !== undefined ? curLat.toFixed(5) : '--'}° N | Longitude: {curLon !== undefined ? curLon.toFixed(5) : '--'}° E
            </p>
          </div>
        </div>

        {/* Nearest summary quick stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Nearest Squad</span>
            <span className="font-bold text-blue-600">
              {nearestTeams[0]?.distance?.toFixed(1) || '--'} km
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Nearest Shelter</span>
            <span className="font-bold text-purple-600">
              {nearestShelters[0]?.distance?.toFixed(1) || '--'} km
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Nearest Incident</span>
            <span className="font-bold text-red-600">
              {nearbyEmergencies[0]?.distance?.toFixed(1) || '--'} km
            </span>
          </div>
        </div>
      </div>

      {/* Main Map */}
      <div className="card-base p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          Tactical Proximity Radar Map Layer
        </h3>
        <MapView
          height="450px"
          userLocation={{ lat: curLat, lon: curLon }}
          emergencies={emergencies}
          teams={teams}
          shelters={shelters}
          resources={resources}
        />
      </div>

      {/* Nearest Entity Matrix (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Nearest Rescue Squads */}
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-blue-600" />
              Nearest Rescue Units
            </h4>
            <Link to="/teams" className="text-[11px] text-blue-600 hover:underline font-semibold">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {nearestTeams.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{t.name}</span>
                  <StatusBadge status={t.status} size="sm" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Compass className="w-3 h-3 text-blue-600" />
                    {t.distance.toFixed(1)} km away
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <Clock className="w-3 h-3" />
                    ~{t.eta} mins ETA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Nearest Emergency Shelters */}
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Nearest Relief Shelters
            </h4>
            <Link to="/shelters" className="text-[11px] text-purple-600 hover:underline font-semibold">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {nearestShelters.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{s.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                    {s.occupied}/{s.capacity} Beds
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Compass className="w-3 h-3 text-blue-600" />
                    {s.distance.toFixed(1)} km away
                  </span>
                  <span className="text-emerald-700 font-medium">
                    {s.capacity - s.occupied} available
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Nearest Emergency Dispatches */}
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Nearby Incidents Radar
            </h4>
            <Link to="/emergencies" className="text-[11px] text-red-600 hover:underline font-semibold">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {nearbyEmergencies.slice(0, 4).map((em) => (
              <div
                key={em.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 truncate max-w-[140px]">
                    #{em.id} {formatEmergencyType(em.emergency_type)}
                  </span>
                  <SeverityBadge severity={em.severity} size="sm" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-red-600">
                    <Compass className="w-3 h-3" />
                    {em.distance.toFixed(1)} km away
                  </span>
                  <Link
                    to={`/emergencies/${em.id}`}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Respond →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationIntelPage;
