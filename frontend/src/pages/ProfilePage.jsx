import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  User,
  Shield,
  Phone,
  Mail,
  LogOut,
  Radio,
  Sparkles,
  HardDrive,
  Trash2,
  Flame,
  Ambulance,
  Users,
} from 'lucide-react';

const ProfilePage = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const { queuedCount, isOnline, networkQuality, refreshQueue } = useOffline();
  const { addToast } = useWebSocket();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleSelect = async (roleKey) => {
    setIsSwitching(true);
    try {
      await switchDemoRole(roleKey);
      addToast('Role Switched', `Switched active session to ${roleKey}`, 'info');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleClearCache = async () => {
    localStorage.clear();
    await refreshQueue();
    window.location.reload();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Operator Profile & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Role authorization, active session credentials, offline cache telemetry, and alert settings.
        </p>
      </div>

      {/* User Card */}
      <div className="card-base p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xs flex-shrink-0 font-bold text-2xl">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{user?.full_name || 'Anonymous User'}</h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full uppercase">
                  {user?.role || 'Citizen'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">@{user?.username}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors flex items-center gap-2 self-start"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Mail className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-[10px] text-slate-500 block font-medium">Email Address</span>
              <span className="text-xs text-slate-800 font-semibold">{user?.email || 'N/A'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Phone className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-[10px] text-slate-500 block font-medium">Contact Phone</span>
              <span className="text-xs text-slate-800 font-semibold">{user?.phone || '+91 98765 43210'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Role Switcher Demo Cards */}
      <div className="card-base p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            1-Click Demo Role Switcher
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Switch roles seamlessly to evaluate role-specific dashboards, permissions, and dispatch workflows.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => handleRoleSelect('admin')}
            className={`p-3.5 rounded-xl border text-left transition-colors flex items-start gap-3 ${
              user?.role === 'admin'
                ? 'bg-blue-50 border-blue-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Director (Admin)</span>
              <span className="text-[11px] text-slate-500">Full system override, audit logs, and settings</span>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('operator')}
            className={`p-3.5 rounded-xl border text-left transition-colors flex items-start gap-3 ${
              user?.role === 'operator'
                ? 'bg-blue-50 border-blue-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Command Operator</span>
              <span className="text-[11px] text-slate-500">Triage emergency requests, dispatch squads, allocate stock</span>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('rescue_team')}
            className={`p-3.5 rounded-xl border text-left transition-colors flex items-start gap-3 ${
              user?.role === 'rescue_team'
                ? 'bg-blue-50 border-blue-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Ambulance className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Rescue Squad Lead</span>
              <span className="text-[11px] text-slate-500">On-scene status updates and photo proof upload</span>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('volunteer')}
            className={`p-3.5 rounded-xl border text-left transition-colors flex items-start gap-3 ${
              user?.role === 'volunteer'
                ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Users className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Volunteer Responder</span>
              <span className="text-[11px] text-slate-500">Receive AI skill-matched tasks and shelter duty</span>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('citizen')}
            className={`p-3.5 rounded-xl border text-left transition-colors flex items-start gap-3 sm:col-span-2 ${
              user?.role === 'citizen'
                ? 'bg-red-50 border-red-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Citizen Public Portal</span>
              <span className="text-[11px] text-slate-500">Trigger 1-Click SOS, voice emergency reports, and shelter locate</span>
            </div>
          </button>
        </div>
      </div>

      {/* Offline Storage & Network Diagnostics */}
      <div className="card-base p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Offline Storage & Telemetry Diagnostics
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
            Network: {networkQuality.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-500 text-[10px] block">Queued Offline Reports (IndexedDB):</span>
            <span className="font-bold text-blue-600">{queuedCount} Items</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">Network State:</span>
            <span className={isOnline ? 'font-bold text-emerald-700' : 'font-bold text-red-700'}>
              {isOnline ? 'ONLINE (Connected)' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleClearCache}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            Clear Local Cache
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
