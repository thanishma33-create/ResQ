import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import DashboardCard from '../components/common/DashboardCard';
import EmergencyCard from '../components/emergency/EmergencyCard';
import MapView from '../components/map/MapView';
import Loading from '../components/common/Loading';
import ErrorState from '../components/common/ErrorState';
import {
  AlertTriangle,
  Flame,
  Radio,
  Truck,
  Users,
  Building2,
  Package,
  ClipboardList,
  CloudRain,
  ArrowRight,
  RefreshCw,
  Activity,
  Plus,
  Wifi,
  WifiOff,
  HardDrive,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import useCurrentLocation from '../hooks/useCurrentLocation';
import { getNearbyAssistance } from '../services/locationApi';

const DashboardPage = () => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const {
    location: userLocation,
    locationName,
    isLocating: isGpsLocating,
    refreshLocation,
  } = useCurrentLocation();
  const {
    isOnline,
    networkQuality,
    queuedCount,
    isSyncing,
    lastSyncTime,
    syncOfflineQueue,
    cacheEntities,
    getCachedEntities,
  } = useOffline();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [nearbySummary, setNearbySummary] = useState({ resources: 0, shelters: 0, teams: 0 });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        analyticsRes,
        emergenciesRes,
        teamsRes,
        sheltersRes,
        disastersRes,
        weatherRes,
      ] = await Promise.all([
        axiosClient.get('/api/analytics/overview'),
        axiosClient.get('/api/emergencies/?limit=6'),
        axiosClient.get('/api/teams/'),
        axiosClient.get('/api/shelters/'),
        axiosClient.get('/api/disasters/'),
        axiosClient.get('/api/weather/alerts'),
      ]);

      setAnalytics(analyticsRes.data);
      setEmergencies(emergenciesRes.data);
      setTeams(teamsRes.data);
      setShelters(sheltersRes.data);
      setDisasters(disastersRes.data);
      setWeatherAlerts(weatherRes.data);

      // Cache analytics and entity snapshots for offline dashboard access
      cacheEntities('dashboard_analytics', analyticsRes.data);
      cacheEntities('dashboard_emergencies', emergenciesRes.data);
      cacheEntities('dashboard_teams', teamsRes.data);
      cacheEntities('dashboard_shelters', sheltersRes.data);
      cacheEntities('dashboard_disasters', disastersRes.data);
    } catch (err) {
      console.warn('Network request failed, loading cached dashboard snapshots:', err);
      try {
        const [cachedAn, cachedEm, cachedTm, cachedSh, cachedDs] = await Promise.all([
          getCachedEntities('dashboard_analytics'),
          getCachedEntities('dashboard_emergencies'),
          getCachedEntities('dashboard_teams'),
          getCachedEntities('dashboard_shelters'),
          getCachedEntities('dashboard_disasters'),
        ]);

        if (cachedAn?.data) {
          setAnalytics(cachedAn.data);
          setEmergencies(cachedEm?.data || []);
          setTeams(cachedTm?.data || []);
          setShelters(cachedSh?.data || []);
          setDisasters(cachedDs?.data || []);
        } else {
          setError('Unable to reach ResQ Command API and no offline cache found.');
        }
      } catch (cacheErr) {
        setError('Unable to reach ResQ Command API. Check backend server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch nearby assistance summary for user's real GPS position
  useEffect(() => {
    if (userLocation?.lat !== undefined && userLocation?.lon !== undefined) {
      getNearbyAssistance(userLocation.lat, userLocation.lon, 5.0)
        .then((res) => {
          setNearbySummary({
            resources: res.data?.resources?.length || 0,
            shelters: res.data?.shelters?.length || 0,
            teams: res.data?.rescue_teams?.length || 0,
          });
        })
        .catch(() => {});
    }
  }, [userLocation?.lat, userLocation?.lon]);

  // Update on WebSocket events
  useEffect(() => {
    if (lastMessage) {
      if (
        lastMessage.event === 'NEW_EMERGENCY' ||
        lastMessage.event === 'SOS_ALERT' ||
        lastMessage.event === 'ASSIGNMENT_CREATED'
      ) {
        fetchData();
      }
    }
  }, [lastMessage]);

  if (isLoading) {
    return <Loading fullScreen text="Initializing ResQ Command Matrix..." />;
  }

  if (error && !analytics) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  // Prep chart data
  const severityData = [
    { name: 'Critical', value: analytics?.emergencies_by_severity?.CRITICAL || 0, color: '#dc2626' },
    { name: 'High', value: analytics?.emergencies_by_severity?.HIGH || 0, color: '#d97706' },
    { name: 'Medium', value: analytics?.emergencies_by_severity?.MEDIUM || 0, color: '#2563eb' },
    { name: 'Low', value: analytics?.emergencies_by_severity?.LOW || 0, color: '#64748b' },
  ].filter((d) => d.value > 0);

  const mockTrendData = [
    { time: '00:00', count: 4 },
    { time: '04:00', count: 7 },
    { time: '08:00', count: 18 },
    { time: '12:00', count: 32 },
    { time: '16:00', count: 28 },
    { time: '20:00', count: 19 },
    { time: 'Now', count: analytics?.total_emergencies || 24 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Disaster Relief Command Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time emergency requests, active rescue teams, relief shelters, and geospatial situation intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh
          </button>

          <Link
            to="/requests"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Request
          </Link>
        </div>
      </div>

      {/* Offline Status & Telemetry Banner (Requirement 13) */}
      <div className="card-base p-4 bg-slate-900 text-white border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          {/* 1. Network Status */}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Internet</span>
              <span className={`text-xs font-bold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                {isOnline ? (isSyncing ? 'SYNCING...' : 'ONLINE') : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* 2. Offline SOS Queue */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Queued SOS</span>
              <Link to="/offline-queue" className="text-xs font-bold text-amber-400 hover:underline">
                {queuedCount} {queuedCount === 1 ? 'Record' : 'Records'}
              </Link>
            </div>
          </div>

          {/* 3. Cached Map Status */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Cached Map</span>
              <span className="text-xs font-bold text-blue-400">
                AVAILABLE
              </span>
            </div>
          </div>

          {/* 4. Last Sync Time */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Last Sync</span>
              <span className="text-xs font-bold text-purple-300">
                {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {queuedCount > 0 && isOnline && (
          <button
            onClick={syncOfflineQueue}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync {queuedCount} Queued</span>
          </button>
        )}
      </div>

      {/* Primary KPI Grid (5 Key Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <DashboardCard
          title="Total Requests"
          value={analytics?.total_emergencies || 0}
          icon={AlertTriangle}
          color="blue"
          subtext="Total logs in registry"
        />
        <DashboardCard
          title="Critical Incidents"
          value={analytics?.emergencies_by_severity?.CRITICAL || 0}
          icon={Flame}
          color="red"
          subtext="Immediate rescue priority"
        />
        <DashboardCard
          title="Available Teams"
          value={`${analytics?.available_rescue_teams || 0} / ${analytics?.total_rescue_teams || 0}`}
          icon={Truck}
          color="emerald"
          subtext="Ready for dispatch"
        />
        <DashboardCard
          title="Shelter Capacity"
          value={`${analytics?.shelter_occupancy_rate_pct || 0}%`}
          icon={Building2}
          color="purple"
          subtext={`${analytics?.total_shelter_occupied || 0} / ${analytics?.total_shelter_capacity || 0} beds`}
        />
        <DashboardCard
          title="Active Disasters"
          value={analytics?.active_disasters_count || 0}
          icon={CloudRain}
          color="amber"
          subtext="Declared hazard zones"
        />
      </div>

      {/* Main Operations Split: Tactical Map + Secondary KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tactical Proximity Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Nearby Assistance</span>
              </h2>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                📍 {locationName || 'Current GPS Location'} (within 5 km: {nearbySummary.resources} supplies, {nearbySummary.shelters} shelters, {nearbySummary.teams} units)
              </span>
            </div>
            <Link
              to="/nearby"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Open Help Near Me <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <MapView
            center={userLocation?.lat ? [userLocation.lat, userLocation.lon] : undefined}
            userLocation={userLocation}
            emergencies={emergencies}
            teams={teams}
            shelters={shelters}
            disasters={disasters}
            weatherAlerts={weatherAlerts}
            height="460px"
          />
        </div>

        {/* Right 1 Col: Severity Breakdown & Response Performance */}
        <div className="space-y-4">
          {/* Severity Breakdown Card */}
          <div className="card-base p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Severity Triage Matrix
              </h3>
              <span className="text-[11px] text-slate-400">By AI Priority</span>
            </div>

            <div className="h-44 flex items-center justify-center">
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">No active incidents</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span className="text-slate-600">Critical: {analytics?.emergencies_by_severity?.CRITICAL || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600">High: {analytics?.emergencies_by_severity?.HIGH || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600">Medium: {analytics?.emergencies_by_severity?.MEDIUM || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-600">Low: {analytics?.emergencies_by_severity?.LOW || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Stack */}
          <div className="card-base p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Command Telemetry
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Avg First-Response ETA</span>
                <span className="font-bold text-emerald-600">
                  {analytics?.avg_response_time_minutes?.toFixed(1) || '14.2'} mins
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Incident Resolution Time</span>
                <span className="font-bold text-blue-600">
                  {analytics?.avg_resolution_time_minutes?.toFixed(1) || '48.5'} mins
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Volunteers Active</span>
                <span className="font-bold text-purple-600">
                  {analytics?.total_volunteers || 0} ({analytics?.available_volunteers || 0} free)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Stock Shortage Alerts</span>
                <span className={`font-bold ${analytics?.resource_shortages_count > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                  {analytics?.resource_shortages_count || 0} items
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Emergency Feed & Volume Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Emergency Requests Feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">
                High Priority Emergency Feed
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
                Real-time
              </span>
            </div>
            <Link
              to="/requests"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All Dispatches <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencies.slice(0, 4).map((em) => (
              <EmergencyCard key={em.id} emergency={em} />
            ))}
          </div>
        </div>

        {/* Right 1 Col: 24h Intake Volume Curve */}
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              24-Hour Incident Volume
            </h3>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>

          <p className="text-xs text-slate-500">
            Intake curve tracking distress signals across active disaster zones.
          </p>

          <div className="h-44 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
