import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Ambulance,
  Package,
  Building2,
  AlertCircle,
  RefreshCw,
  Navigation,
  Flame,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useCurrentLocation from '../../hooks/useCurrentLocation';
import { getNearbyAssistance } from '../../services/nearbyService';
import { useWebSocket } from '../../context/WebSocketContext';
import { useOffline } from '../../context/OfflineContext';
import CurrentLocation from './CurrentLocation';
import NearbyMap from './NearbyMap';
import NearbyResources from './NearbyResources';
import NearbyShelters from './NearbyShelters';
import NearbyTeams from './NearbyTeams';
import LocationPermission from './LocationPermission';
import Loading from '../common/Loading';
import Modal from '../common/Modal';

const NearbyAssistance = () => {
  const {
    location,
    locationName,
    loading: isLocating,
    error: locationError,
    permission: permissionStatus,
    lastUpdated,
    isLiveTracking,
    refreshLocation,
    toggleLiveTracking,
  } = useCurrentLocation();

  const { isOnline } = useOffline();
  const { addToast } = useWebSocket();

  const [radius, setRadius] = useState(5.0);
  const [nearbyData, setNearbyData] = useState({
    resources: [],
    shelters: [],
    rescue_teams: [],
    emergencies: [],
    ai_recommendations: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [cachedAt, setCachedAt] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'teams' | 'resources' | 'shelters'

  // Dispatch modal
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [dispatchNote, setDispatchNote] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Load nearby data from API
  const loadNearby = async (lat, lon, r) => {
    if (lat === undefined || lon === undefined || lat === null || lon === null) return;
    setIsLoading(true);
    try {
      const res = await getNearbyAssistance(lat, lon, r);
      setNearbyData(res.data || {});
      setIsOfflineCached(res.isOfflineCached || false);
      setCachedAt(res.cachedAt || null);
    } catch (err) {
      console.warn('Failed to load nearby assistance:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location?.latitude !== undefined && location?.longitude !== undefined) {
      loadNearby(location.latitude, location.longitude, radius);
    } else if (location?.lat !== undefined && location?.lon !== undefined) {
      loadNearby(location.lat, location.lon, radius);
    }
  }, [location?.latitude, location?.longitude, location?.lat, location?.lon, radius]);

  const handleManualRefresh = async () => {
    const updated = await refreshLocation();
    const lat = updated?.latitude || updated?.lat;
    const lon = updated?.longitude || updated?.lon;
    if (lat !== undefined && lon !== undefined) {
      await loadNearby(lat, lon, radius);
      addToast('Location Updated', 'Refreshed GPS coordinates and nearby assistance data.', 'info');
    }
  };

  const handleExpandRadius = () => {
    setRadius((prev) => {
      if (prev < 3.0) return 3.0;
      if (prev < 5.0) return 5.0;
      if (prev < 10.0) return 10.0;
      return 25.0;
    });
  };

  const handleDispatchSquad = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setIsDispatching(true);
    try {
      addToast('Dispatch Request Sent', `Request submitted for ${selectedTeam.name}.`, 'success');
      setSelectedTeam(null);
      setDispatchNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  const aiRecs = nearbyData?.ai_recommendations;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Location Permission / Action Banner if not granted yet */}
      {(!location?.lat && !location?.latitude) || permissionStatus !== 'granted' ? (
        <LocationPermission
          permissionStatus={permissionStatus}
          error={locationError}
          onRetry={handleManualRefresh}
          isLocating={isLocating}
        />
      ) : null}

      {/* Offline Notice Banner */}
      {(!isOnline || isOfflineCached) && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>OFFLINE — SHOWING CACHED ASSISTANCE DATA:</strong> Showing locally saved resources, shelters, and teams.
            </span>
          </div>
          {cachedAt && (
            <span className="text-[11px] text-amber-700 font-mono flex-shrink-0">
              Last updated: {new Date(cachedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* 1. Current Location Banner & Radius Selector */}
      <CurrentLocation
        location={location}
        locationName={locationName}
        isLocating={isLocating}
        error={locationError}
        lastUpdated={lastUpdated}
        onRefresh={handleManualRefresh}
        isLiveTracking={isLiveTracking}
        onToggleLiveTracking={toggleLiveTracking}
        radius={radius}
        onRadiusChange={setRadius}
      />

      {/* 2. AI Recommended Assistance Banner (If available) */}
      {aiRecs && (
        <div className="card-base p-4 border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50/50 to-purple-50/30 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              AI Recommended Proximity Assistance
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            {aiRecs.recommended_team && (
              <div className="p-3 rounded-lg bg-white border border-blue-200 space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700 flex items-center gap-1.5">
                    <Ambulance className="w-4 h-4 text-blue-600" />
                    {aiRecs.recommended_team.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                    {aiRecs.recommended_team.distance_km} km
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {aiRecs.recommended_team.reasons?.join(' • ') || 'Closest available emergency response unit.'}
                </p>
              </div>
            )}

            {aiRecs.recommended_shelter && (
              <div className="p-3 rounded-lg bg-white border border-purple-200 space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-700 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    {aiRecs.recommended_shelter.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                    {aiRecs.recommended_shelter.distance_km} km ({aiRecs.recommended_shelter.available_capacity} free beds)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {aiRecs.recommended_shelter.reasons?.join(' • ') || 'Nearest open relief shelter with capacity.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Focused Nearby Leaflet Map */}
      <NearbyMap
        userLocation={location}
        radiusKm={radius}
        resources={nearbyData?.resources || []}
        shelters={nearbyData?.shelters || []}
        teams={nearbyData?.rescue_teams || []}
        emergencies={nearbyData?.emergencies || []}
        onLocateMe={handleManualRefresh}
        isLocating={isLocating}
      />

      {/* 4. Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto custom-scrollbar">
        {[
          { key: 'all', label: 'All Nearby Help' },
          { key: 'teams', label: `🚑 Rescue Teams (${nearbyData?.rescue_teams?.length || 0})` },
          { key: 'resources', label: `📦 Supplies (${nearbyData?.resources?.length || 0})` },
          { key: 'shelters', label: `🏫 Relief Shelters (${nearbyData?.shelters?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. Detailed Lists */}
      {isLoading ? (
        <Loading text="🔎 Finding nearby assistance around your current location..." />
      ) : (
        <div className="space-y-6">
          {(activeTab === 'all' || activeTab === 'teams') && (
            <NearbyTeams
              teams={nearbyData?.rescue_teams || []}
              radiusKm={radius}
              onExpandRadius={handleExpandRadius}
              onRequestTeam={(team) => setSelectedTeam(team)}
            />
          )}

          {(activeTab === 'all' || activeTab === 'resources') && (
            <NearbyResources
              resources={nearbyData?.resources || []}
              radiusKm={radius}
              onExpandRadius={handleExpandRadius}
              onRequestResource={(item) =>
                addToast('Supply Requested', `Requested ${item.name} from ${item.location_name}`, 'info')
              }
            />
          )}

          {(activeTab === 'all' || activeTab === 'shelters') && (
            <NearbyShelters
              shelters={nearbyData?.shelters || []}
              radiusKm={radius}
              onExpandRadius={handleExpandRadius}
            />
          )}
        </div>
      )}

      {/* Modal: Dispatch Squad Request */}
      <Modal
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        title={`🚑 Request Dispatch: ${selectedTeam?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDispatchSquad} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <p><strong>Specialty:</strong> {selectedTeam?.specialty}</p>
            <p><strong>Distance:</strong> {selectedTeam?.distance_km} km</p>
            <p><strong>Team Leader:</strong> {selectedTeam?.team_leader}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatch Instructions / Emergency Coordinates *
            </label>
            <textarea
              rows={3}
              required
              value={dispatchNote}
              onChange={(e) => setDispatchNote(e.target.value)}
              placeholder="State exact target coordinates, victims count, and flood level..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedTeam(null)}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDispatching}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer"
            >
              {isDispatching ? 'Transmitting...' : 'Confirm Dispatch Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NearbyAssistance;
