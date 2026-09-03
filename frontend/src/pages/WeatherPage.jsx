import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatDate } from '../utils/formatters';
import {
  CloudRain,
  Wind,
  Thermometer,
  Waves,
  Mountain,
  AlertTriangle,
  Plus,
  RefreshCw,
} from 'lucide-react';

import useCurrentLocation from '../hooks/useCurrentLocation';
import { getCurrentPosition } from '../services/locationService';

const ALERT_LEVELS = ['ADVISORY', 'WATCH', 'WARNING', 'SEVERE_WARNING'];

const WeatherPage = () => {
  const { location: userGpsLocation } = useCurrentLocation();
  const [alerts, setAlerts] = useState([]);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    location_name: '',
    latitude: '',
    longitude: '',
    weather_condition: 'Heavy Monsoonal Rain',
    temperature: 27.5,
    rainfall_mm: 120.5,
    wind_speed_kmh: 45.0,
    flood_risk: 'CRITICAL',
    landslide_risk: 'HIGH',
    cyclone_risk: 'MEDIUM',
    alert_level: 'WARNING',
    description: 'Severe rainfall causing localized urban flooding in low-lying river catchment basins.',
    is_simulated: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { hasRole } = useAuth();
  const { addToast } = useWebSocket();

  const fetchWeatherData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [alertsRes, currentRes, riskRes] = await Promise.allSettled([
        axiosClient.get('/api/weather/alerts'),
        axiosClient.get('/api/weather/current'),
        axiosClient.get('/api/weather/risk-assessment'),
      ]);

      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data);
      if (currentRes.status === 'fulfilled') setCurrentWeather(currentRes.value.data);
      if (riskRes.status === 'fulfilled') setRiskAssessment(riskRes.value.data);
    } catch (err) {
      console.error('Failed to load weather data:', err);
      setError('Failed to fetch meteorological radar feeds.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!formData.location_name || !formData.description) {
      setFormError('Please enter location and hazard description.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await axiosClient.post('/api/weather/alerts', formData);
      addToast('Weather Alert Issued', `Alert broadcast for ${formData.location_name}`, 'warning');
      setShowCreateModal(false);
      fetchWeatherData();
    } catch (err) {
      console.error('Weather alert failed:', err);
      setFormError(err.response?.data?.detail || 'Failed to publish weather alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskBadge = (level = 'LOW') => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'MEDIUM':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Weather & Multi-Hazard Early Warnings
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              Radar Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Meteorological feeds, precipitation gauges, landslide slope analysis, and simulated telemetry feeds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchWeatherData}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {hasRole(['admin', 'operator']) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Issue Hazard Advisory
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Live Weather Sensor Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-base p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Rainfall (24h)</span>
            <CloudRain className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 block">
            {currentWeather?.rainfall_mm || 120.5} <span className="text-xs font-normal text-slate-500">mm</span>
          </span>
          <span className="text-[11px] text-blue-600 font-medium block">Heavy Inundation</span>
        </div>

        <div className="card-base p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Wind Velocity</span>
            <Wind className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 block">
            {currentWeather?.wind_speed_kmh || 48.0} <span className="text-xs font-normal text-slate-500">km/h</span>
          </span>
          <span className="text-[11px] text-slate-500 block">Gusts up to 65 km/h</span>
        </div>

        <div className="card-base p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Ambient Temp</span>
            <Thermometer className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 block">
            {currentWeather?.temperature || 26.8} <span className="text-xs font-normal text-slate-500">°C</span>
          </span>
          <span className="text-[11px] text-amber-600 font-medium block">Humidity: 94%</span>
        </div>

        <div className="card-base p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Active Advisories</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-red-600 block">
            {alerts.length}
          </span>
          <span className="text-[11px] text-red-600 font-medium block">Red Alert Monitored</span>
        </div>
      </div>

      {/* Multi-Hazard Risk Matrix Indicator */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Waves className="w-4 h-4 text-blue-600" />
            Kerala Basin Multi-Hazard Threat Radar
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            Simulated Sensor Stream
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-blue-600" />
                Flood Risk Level
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${getRiskBadge(riskAssessment?.flood_risk || 'CRITICAL')}`}>
                {riskAssessment?.flood_risk || 'CRITICAL'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Low-lying river catchment basins overflowing due to sustained rainfall.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Mountain className="w-4 h-4 text-amber-600" />
                Landslide Risk
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${getRiskBadge(riskAssessment?.landslide_risk || 'HIGH')}`}>
                {riskAssessment?.landslide_risk || 'HIGH'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              High slope soil saturation in Western Ghats hilly terrain.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-blue-600" />
                Cyclone Threat
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${getRiskBadge(riskAssessment?.cyclone_risk || 'LOW')}`}>
                {riskAssessment?.cyclone_risk || 'LOW'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Deep depression in Arabian Sea producing squally weather along coast.
            </p>
          </div>
        </div>
      </div>

      {/* Active Bulletins Feed */}
      {isLoading ? (
        <Loading text="Loading hazard bulletins..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchWeatherData} />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No Active Weather Advisories"
          description="Atmospheric conditions are stable. No severe weather bulletins active."
        />
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Active Warning Bulletins ({alerts.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((al, idx) => (
              <div
                key={al.id || idx}
                className="card-base p-5 border-l-4 border-l-red-500 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold uppercase">
                      {al.alert_level}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{al.location_name}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {al.is_simulated ? 'SIMULATED DATA' : 'OFFICIAL IMD'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {al.description}
                </p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[9px] text-slate-500 block">Rainfall</span>
                    <span className="font-bold text-blue-600">{al.rainfall_mm}mm</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Flood Risk</span>
                    <span className="font-bold text-red-600">{al.flood_risk}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Landslide</span>
                    <span className="font-bold text-amber-600">{al.landslide_risk}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  Issued: {formatDate(al.issued_at || al.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Issue Hazard Advisory */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="🌧️ Issue Meteorological Hazard Advisory"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateAlert} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Location *</label>
            <input
              type="text"
              required
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              placeholder="e.g., Coastal Weather Sector 4"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alert Level *</label>
              <select
                value={formData.alert_level}
                onChange={(e) => setFormData({ ...formData, alert_level: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {ALERT_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Flood Risk Level</label>
              <select
                value={formData.flood_risk}
                onChange={(e) => setFormData({ ...formData, flood_risk: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rainfall (mm)</label>
              <input
                type="number"
                step="any"
                value={formData.rainfall_mm}
                onChange={(e) => setFormData({ ...formData, rainfall_mm: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Wind (km/h)</label>
              <input
                type="number"
                step="any"
                value={formData.wind_speed_kmh}
                onChange={(e) => setFormData({ ...formData, wind_speed_kmh: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Temp (°C)</label>
              <input
                type="number"
                step="any"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Warning Advisory Description *
            </label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Extreme rainfall expected in the next 6 hours. Evacuation in progress."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Issuing...' : 'Broadcast Warning'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WeatherPage;
