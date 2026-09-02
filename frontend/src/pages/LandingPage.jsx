import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LifeBuoy,
  Flame,
  Users,
  Ambulance,
  Building2,
  Package,
  Radio,
  ArrowRight,
  PhoneCall,
  Sparkles,
  Download,
  CheckCircle2,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useOffline } from '../context/OfflineContext';

const LandingPage = () => {
  const [stats, setStats] = useState({
    totalEmergencies: 142,
    activeDisasters: 3,
    activeTeams: 18,
    volunteersDeployed: 240,
  });
  const [activeBroadcasts, setActiveBroadcasts] = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const { canInstallPWA, promptPWAInstall } = useOffline();

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [statsRes, broadcastsRes, weatherRes] = await Promise.allSettled([
          axiosClient.get('/api/analytics/overview'),
          axiosClient.get('/api/broadcasts/'),
          axiosClient.get('/api/weather/alerts'),
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats({
            totalEmergencies: statsRes.value?.data?.total_emergencies || 142,
            activeDisasters: statsRes.value?.data?.active_disasters_count || 3,
            activeTeams: statsRes.value?.data?.total_rescue_teams || 18,
            volunteersDeployed: statsRes.value?.data?.total_volunteers || 240,
          });
        }
        if (broadcastsRes.status === 'fulfilled') {
          setActiveBroadcasts(broadcastsRes.value?.data?.slice(0, 2) || []);
        }
        if (weatherRes.status === 'fulfilled') {
          setWeatherAlerts(weatherRes.value?.data?.slice(0, 3) || []);
        }
      } catch {
        // Fallback
      }
    };

    fetchPublicData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Public Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                ResQ
              </span>
              <span className="text-[10px] text-slate-500 block -mt-1 font-medium">
                Disaster Relief & Coordination
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canInstallPWA && (
              <button
                onClick={promptPWAInstall}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            )}

            <Link
              to="/sos"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors animate-pulse"
            >
              <Flame className="w-4 h-4" />
              1-Click SOS
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              Live Command Center
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Emergency Broadcast Top Alerts (If any) */}
      {activeBroadcasts.length > 0 && (
        <div className="bg-red-600 px-4 py-2 text-center text-xs text-white font-medium">
          <span className="font-bold uppercase mr-2">🚨 URGENT BROADCAST:</span>
          {activeBroadcasts[0].title} — {activeBroadcasts[0].message}
        </div>
      )}

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI-Driven Disaster Command & Location Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Rapid Response. <br />
            <span className="text-blue-600">
              Coordinated Relief.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ResQ connects stranded citizens, specialized NDRF & SDRF rescue squads, volunteer networks,
            shelters, and resource depots with real-time geospatial triage and offline-first PWA dispatch.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/sos"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-base font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <Flame className="w-6 h-6 animate-pulse" />
              SEND EMERGENCY SOS
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs transition-transform hover:scale-105"
            >
              Open Command Center
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>

          {/* Helpline Emergency Ticker */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 text-red-600 font-semibold">
              <PhoneCall className="w-4 h-4" /> NDRF Control: 1078
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
              <PhoneCall className="w-4 h-4" /> State Disaster: 1070
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
              <PhoneCall className="w-4 h-4" /> Ambulance: 108
            </span>
          </div>
        </div>

        {/* Live System Counter Cards */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto w-full">
          <div className="card-base p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">
              {stats.totalEmergencies}+
            </span>
            <p className="text-xs text-slate-500 font-medium">
              Incidents Logged
            </p>
          </div>

          <div className="card-base p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-red-600">
              {stats.activeDisasters}
            </span>
            <p className="text-xs text-slate-500 font-medium">
              Monitored Hazard Zones
            </p>
          </div>

          <div className="card-base p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">
              {stats.activeTeams}
            </span>
            <p className="text-xs text-slate-500 font-medium">
              Active Rescue Units
            </p>
          </div>

          <div className="card-base p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
              {stats.volunteersDeployed}+
            </span>
            <p className="text-xs text-slate-500 font-medium">
              Registered Volunteers
            </p>
          </div>
        </div>

        {/* Role Portal Shortcuts */}
        <div className="mt-16 max-w-5xl mx-auto w-full">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4 text-center">
            Role-Based Portal Access
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/emergencies"
              className="card-base p-6 hover:border-blue-400 transition-all hover:shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mb-3">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                Citizen Assistance
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Report trapped individuals, request relief materials, locate nearby shelters and medical camps.
              </p>
            </Link>

            <Link
              to="/teams"
              className="card-base p-6 hover:border-blue-400 transition-all hover:shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mb-3">
                <Ambulance className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                Rescue Squad Command
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Receive live GPS dispatch missions, update on-scene telemetry, and upload photo proof of resolution.
              </p>
            </Link>

            <Link
              to="/volunteers"
              className="card-base p-6 hover:border-blue-400 transition-all hover:shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Volunteer Corps
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                AI skill-based matching for medical personnel, boat operators, food distribution, and shelter operations.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>ResQ Disaster Relief & Volunteer Coordination System • Kerala Command Center v1.0</p>
      </footer>
    </div>
  );
};

export default LandingPage;
