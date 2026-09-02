import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useWebSocket } from '../context/WebSocketContext';
import useCurrentLocation from '../hooks/useCurrentLocation';
import { getNearbyAssistance } from '../services/locationApi';
import { formatDistance, formatETA } from '../services/locationService';
import LocationPermission from '../components/nearby/LocationPermission';
import LocationAccuracy from '../components/nearby/LocationAccuracy';
import {
  Flame,
  MapPin,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  WifiOff,
  Clock,
  HardDrive,
  Edit3,
  Ambulance,
  Building2,
  Package,
  Compass,
} from 'lucide-react';

const SOSPage = () => {
  const { user } = useAuth();
  const {
    location: currentGpsLocation,
    locationName,
    isLocating: gpsLoading,
    error: locationError,
    permissionStatus,
    refreshLocation,
  } = useCurrentLocation();

  const [name, setName] = useState(user?.full_name || user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [people, setPeople] = useState(1);
  const [message, setMessage] = useState('EMERGENCY SOS: Immediate rescue needed');
  const [medicalNeeded, setMedicalNeeded] = useState(false);
  const [trapped, setTrapped] = useState(false);

  // Manual Coordinates Override
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [nearbyPreview, setNearbyPreview] = useState(null);

  // Transmission State
  const [isSending, setIsSending] = useState(false);
  const [transmissionStatus, setTransmissionStatus] = useState(null); // 'online_success' | 'offline_queued'
  const [responseResult, setResponseResult] = useState(null);
  const [queuedItemResult, setQueuedItemResult] = useState(null);

  const { isOnline, queueSOS } = useOffline();
  const { addToast } = useWebSocket();

  useEffect(() => {
    if (user) {
      if (!name && (user.full_name || user.username)) {
        setName(user.full_name || user.username);
      }
      if (!phone && user.phone) {
        setPhone(user.phone);
      }
    }
  }, [user]);

  // Keep manual coordinates inputs synced when GPS updates initially
  useEffect(() => {
    if (currentGpsLocation?.lat !== undefined && !manualLat) {
      setManualLat(Number(currentGpsLocation.lat).toFixed(4));
      setManualLon(Number(currentGpsLocation.lon).toFixed(4));
    }
    if (currentGpsLocation?.lat !== undefined && currentGpsLocation?.lon !== undefined) {
      getNearbyAssistance(currentGpsLocation.lat, currentGpsLocation.lon, 5.0)
        .then((res) => setNearbyPreview(res.data))
        .catch(() => {});
    }
  }, [currentGpsLocation]);

  const handleTriggerSOS = async (e) => {
    if (e) e.preventDefault();

    setIsSending(true);
    setTransmissionStatus(null);

    const lat = showManualCoords && manualLat
      ? parseFloat(manualLat)
      : currentGpsLocation?.lat !== undefined
      ? currentGpsLocation.lat
      : null;

    const lon = showManualCoords && manualLon
      ? parseFloat(manualLon)
      : currentGpsLocation?.lon !== undefined
      ? currentGpsLocation.lon
      : null;

    const effectiveName = name.trim() || user?.full_name || user?.username || 'Emergency Citizen';
    const effectivePhone = phone.trim() || user?.phone || '+91 99999 99999';

    const payload = {
      name: effectiveName,
      phone: effectivePhone,
      latitude: lat,
      longitude: lon,
      gps_accuracy: currentGpsLocation?.accuracy || null,
      people: Number(people || 1),
      message: message.trim() || 'EMERGENCY SOS: Immediate rescue needed',
      medical_needed: Boolean(medicalNeeded),
      trapped: Boolean(trapped),
      client_sos_id: `sos_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      client_created_at: new Date().toISOString(),
    };

    if (isOnline) {
      try {
        const res = await axiosClient.post('/api/sos/', payload);
        setResponseResult(res.data);
        setTransmissionStatus('online_success');
        addToast(
          '🚨 SOS DISPATCHED',
          `SOS alert broadcast to command center. Priority: ${res.data.priority_score?.toFixed(0) || 95}`,
          'danger'
        );
      } catch (err) {
        console.error('Online SOS transmission failed, saving offline:', err);
        // Fallback to IndexedDB queue if network or server request fails
        const queuedItem = await queueSOS(payload);
        setQueuedItemResult(queuedItem);
        setTransmissionStatus('offline_queued');
        addToast('SOS Saved Offline', 'Network dropped. Saved locally in IndexedDB.', 'warning');
      } finally {
        setIsSending(false);
      }
    } else {
      // OFFLINE: Save directly to IndexedDB
      const queuedItem = await queueSOS(payload);
      setQueuedItemResult(queuedItem);
      setTransmissionStatus('offline_queued');
      setIsSending(false);
      addToast('SOS Stored Offline', 'Saved on this device. Auto-transmitting when network is restored.', 'info');
    }
  };

  const hasFix = currentGpsLocation?.lat !== undefined && currentGpsLocation?.lon !== undefined;

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center max-w-3xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 text-red-600" />
          <span>High Priority Distress Dispatch</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          1-Click Emergency SOS Beacon
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Works online and offline. Live coordinates and emergency details are stored securely in IndexedDB and dispatched immediately upon connectivity.
        </p>
      </div>

      {/* Permission warning if denied */}
      {permissionStatus === 'denied' && (
        <LocationPermission
          permissionStatus={permissionStatus}
          error={locationError}
          onRetry={refreshLocation}
          isLocating={gpsLoading}
          onManualCoords={() => setShowManualCoords(true)}
        />
      )}

      {/* 1. ONLINE Confirmation Banner */}
      {transmissionStatus === 'online_success' && (
        <div className="w-full p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-emerald-900">
            SOS Beacon Transmitted Successfully
          </h2>
          <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
            Distress request recorded as Incident #{responseResult?.emergency_id || 'ACTIVE'} with severity{' '}
            <strong>{responseResult?.severity || 'CRITICAL'}</strong>. Rescue units and nearby centers have been alerted.
          </p>
          <div className="pt-2 flex justify-center">
            <Link
              to={`/emergencies/${responseResult?.emergency_id || ''}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
            >
              Track Live Rescue Status <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. OFFLINE Confirmation Banner */}
      {transmissionStatus === 'offline_queued' && (
        <div className="w-full p-5 rounded-xl bg-amber-50 border border-amber-300 text-center space-y-3 shadow-xs animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-amber-900">
              OFFLINE — SOS STORED ON THIS DEVICE
            </h2>
            <span className="inline-block mt-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
              Status: QUEUED_OFFLINE • ID: {queuedItemResult?.client_sos_id}
            </span>
          </div>
          <p className="text-xs text-amber-800 max-w-lg mx-auto leading-relaxed font-medium">
            Internet unavailable. Your SOS is saved securely on this device and will be sent automatically when connectivity returns.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/offline-queue"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 shadow-xs"
            >
              <span>View in Offline Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Main SOS Console Card */}
      <div className="w-full card-base p-6 sm:p-8 space-y-6">
        {/* Giant Pulsating SOS Button */}
        <div className="flex flex-col items-center justify-center pt-2">
          <button
            type="button"
            onClick={handleTriggerSOS}
            disabled={isSending}
            className="group relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex flex-col items-center justify-center shadow-lg transition-all border-4 border-red-400 cursor-pointer"
          >
            {isSending ? (
              <RefreshCw className="w-10 h-10 animate-spin text-white" />
            ) : (
              <>
                <Flame className="w-10 h-10 text-white mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-3xl font-black tracking-wider">
                  SOS
                </span>
                <span className="text-[10px] tracking-wider uppercase opacity-90 mt-1 font-semibold">
                  {isOnline ? 'Tap to Dispatch' : 'Tap to Store Offline'}
                </span>
              </>
            )}
          </button>

          {/* GPS telemetry pill and manual override toggle */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {gpsLoading ? (
                <span className="text-slate-500 animate-pulse">Acquiring GPS Position...</span>
              ) : hasFix ? (
                <span className="font-mono text-[11px]">
                  {Number(currentGpsLocation.lat).toFixed(4)}, {Number(currentGpsLocation.lon).toFixed(4)}
                </span>
              ) : (
                <span className="text-amber-700 text-[11px]">Location Not Set</span>
              )}
              {currentGpsLocation?.accuracy && <LocationAccuracy accuracy={currentGpsLocation.accuracy} />}
            </div>

            <button
              type="button"
              onClick={() => setShowManualCoords(!showManualCoords)}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{showManualCoords ? 'Use Auto GPS' : 'Edit Location'}</span>
            </button>
          </div>

          {/* Manual Location Input if GPS is unavailable or blocked */}
          {showManualCoords && (
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 w-full max-w-sm text-left">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 9.9312"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 76.2673"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Details Form */}
        <form onSubmit={handleTriggerSOS} className="space-y-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                People in Danger
              </label>
              <input
                type="number"
                min={1}
                value={people}
                onChange={(e) => setPeople(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-blue-600 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Urgent Situation Message
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Briefly state situation..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Warning Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={trapped}
                onChange={(e) => setTrapped(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-slate-300"
              />
              <span className="text-xs font-semibold text-red-700">
                ⚠️ People Trapped / Rising Water
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={medicalNeeded}
                onChange={(e) => setMedicalNeeded(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-slate-300"
              />
              <span className="text-xs font-semibold text-red-700">
                🚑 Urgent Medical Assistance
              </span>
            </label>
          </div>
        </form>
      </div>

      {/* Nearby Assistance Preview Card */}
      {nearbyPreview && (
        <div className="w-full card-base p-5 space-y-3 bg-slate-50/70 border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              Assistance Available in Proximity (within 5 km of your location)
            </h3>
            <Link
              to="/nearby"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Open Help Near Me <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Nearest Squad */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block flex items-center gap-1">
                <Ambulance className="w-3.5 h-3.5 text-blue-600" /> Closest Rescue Unit
              </span>
              {nearbyPreview.rescue_teams?.length > 0 ? (
                <div>
                  <span className="font-bold text-slate-900 block truncate">{nearbyPreview.rescue_teams[0].name}</span>
                  <span className="text-[11px] text-blue-600 font-medium">
                    {formatDistance(nearbyPreview.rescue_teams[0].distance_km)} ({formatETA(nearbyPreview.rescue_teams[0].eta_minutes)})
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 italic text-[11px]">No active units in 5 km</span>
              )}
            </div>

            {/* Nearest Shelter */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-600" /> Closest Relief Camp
              </span>
              {nearbyPreview.shelters?.length > 0 ? (
                <div>
                  <span className="font-bold text-slate-900 block truncate">{nearbyPreview.shelters[0].name}</span>
                  <span className="text-[11px] text-purple-700 font-medium">
                    {formatDistance(nearbyPreview.shelters[0].distance_km)} • {nearbyPreview.shelters[0].available_capacity} free beds
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 italic text-[11px]">No open shelters in 5 km</span>
              )}
            </div>

            {/* Nearest Supplies */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-emerald-600" /> Emergency Supplies
              </span>
              {nearbyPreview.resources?.length > 0 ? (
                <div>
                  <span className="font-bold text-slate-900 block truncate">{nearbyPreview.resources[0].name}</span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {formatDistance(nearbyPreview.resources[0].distance_km)} • {nearbyPreview.resources[0].available_quantity} available
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 italic text-[11px]">No stock in 5 km</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOSPage;
