import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useWebSocket } from '../context/WebSocketContext';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import SeverityBadge from '../components/common/SeverityBadge';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import {
  Bell,
  CheckCheck,
  Flame,
  RefreshCw,
} from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { lastMessage, addToast } = useWebSocket();

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/api/notifications/?unread_only=${unreadOnly}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to fetch notification feed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  useEffect(() => {
    if (lastMessage?.event === 'NOTIFICATION' || lastMessage?.event === 'SOS_ALERT') {
      fetchNotifications();
    }
  }, [lastMessage]);

  const handleMarkAsRead = async (id) => {
    try {
      await axiosClient.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.post('/api/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      addToast('All Read', 'All notifications marked as read.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Alert & Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-full animate-pulse">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time critical SOS dispatches, team assignments, weather alerts, and broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchNotifications}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-blue-600" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !unreadOnly
              ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Notifications ({notifications.length})
        </button>

        <button
          onClick={() => setUnreadOnly(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            unreadOnly
              ? 'bg-red-50 text-red-700 border border-red-200 font-semibold shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <Loading text="Loading notification stream..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications Found"
          description="Your notification feed is clear. All operational dispatches are up to date."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card-base p-4 sm:p-5 flex flex-col justify-between transition-colors ${
                !n.is_read
                  ? 'border-l-4 border-l-blue-600 bg-white'
                  : 'bg-slate-50/70 opacity-90'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.severity === 'CRITICAL' || n.type === 'SOS_ALERT'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {n.type === 'SOS_ALERT' ? (
                      <Flame className="w-5 h-5 text-red-600 animate-pulse" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        {n.type}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[11px] text-slate-400 mt-2 block font-mono">
                      {formatDate(n.created_at)} ({formatRelativeTime(n.created_at)})
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <SeverityBadge severity={n.severity} size="sm" />
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
