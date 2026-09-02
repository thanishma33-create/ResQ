import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useOffline } from '../../context/OfflineContext';
import NetworkStatus from './NetworkStatus';
import axiosClient from '../../api/axiosClient';
import {
  Bell,
  Radio,
  User,
  LogOut,
  Menu,
  Flame,
  ShieldCheck,
  ChevronDown,
  Download,
} from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isConnected, lastMessage } = useWebSocket();
  const { canInstallPWA, promptPWAInstall } = useOffline();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUnread = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axiosClient.get('/api/notifications/unread-count');
      setUnreadCount(res.data.unread_count || 0);

      const notifsRes = await axiosClient.get('/api/notifications/?unread_only=true');
      setRecentNotifications(notifsRes.data.slice(0, 5));
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (lastMessage?.event === 'NOTIFICATION' || lastMessage?.event === 'SOS_ALERT') {
      fetchUnread();
    }
  }, [lastMessage]);

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.post('/api/notifications/mark-all-read');
      setUnreadCount(0);
      setRecentNotifications([]);
      setShowNotifications(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs h-16 flex-shrink-0">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
        {/* Left: Hamburger & Breadcrumb Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">
              ResQ Platform
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-medium text-slate-500 capitalize">
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* Center: Live Status & Network Status */}
        <div className="hidden md:flex items-center gap-3">
          {/* Live Telemetry Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isConnected ? 'LIVE FEED' : 'RECONNECTING'}</span>
          </div>

          <NetworkStatus />
        </div>

        {/* Right: Actions, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* PWA Install Button */}
          {canInstallPWA && (
            <button
              onClick={promptPWAInstall}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs"
              title="Install ResQ Progressive Web App for offline access"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Install App</span>
            </button>
          )}

          {/* Emergency SOS Button */}
          <Link
            to="/sos"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>1-Click SOS</span>
          </Link>

          {/* User Role Badge */}
          {isAuthenticated && user?.role && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="capitalize">{user.role.replace('_', ' ')}</span>
            </div>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 animate-fadeIn space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                  {recentNotifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">No unread alerts</div>
                  ) : (
                    recentNotifications.map((n) => (
                      <div key={n.id} className="p-2.5 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                          <span className="text-blue-600">{n.title}</span>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    View All Notifications &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {user?.role}
                    </span>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 text-slate-700 transition-colors mt-1"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Profile & Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-red-50 text-red-600 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
