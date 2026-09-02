import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import SeverityBadge from '../components/common/SeverityBadge';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import {
  Radio,
  Plus,
  Trash2,
  RefreshCw,
  MapPin,
  Megaphone,
} from 'lucide-react';

const BroadcastsPage = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    severity: 'HIGH',
    target_area: 'Thiruvananthapuram District & Coastal Areas',
    latitude: 8.5241,
    longitude: 76.9366,
    radius_km: 25.0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { hasRole } = useAuth();
  const { addToast } = useWebSocket();

  const fetchBroadcasts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/broadcasts/');
      setBroadcasts(res.data);
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
      setError('Failed to fetch emergency broadcasts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      setFormError('Please enter both title and broadcast message.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await axiosClient.post('/api/broadcasts/', formData);
      addToast('Emergency Broadcast Issued', `Broadcast "${formData.title}" published live.`, 'danger');
      setShowCreateModal(false);
      fetchBroadcasts();
    } catch (err) {
      console.error('Broadcast failed:', err);
      setFormError(err.response?.data?.detail || 'Failed to issue broadcast.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to retract emergency broadcast "${title}"?`)) return;
    try {
      await axiosClient.delete(`/api/broadcasts/${id}`);
      addToast('Broadcast Retracted', `Broadcast retracted.`, 'info');
      fetchBroadcasts();
    } catch (err) {
      console.error(err);
      addToast('Retract Failed', 'Failed to remove broadcast.', 'danger');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Emergency Public Broadcast Console
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-full animate-pulse">
              Live Air-Wave Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant statewide high-priority civil emergency announcements and SMS/Push dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchBroadcasts}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {hasRole(['admin', 'operator']) && (
            <button
              onClick={() => {
                setFormData({
                  title: '',
                  message: '',
                  severity: 'HIGH',
                  target_area: 'Thiruvananthapuram District & Coastal Areas',
                  latitude: 8.5241,
                  longitude: 76.9366,
                  radius_km: 25.0,
                });
                setFormError('');
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" />
              Transmit Emergency Broadcast
            </button>
          )}
        </div>
      </div>

      {/* Broadcasts List */}
      {isLoading ? (
        <Loading text="Loading active broadcasts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBroadcasts} />
      ) : broadcasts.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No Active Emergency Broadcasts"
          description="There are currently no active public alerts transmitted across the network."
          actionLabel="Transmit Broadcast"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {broadcasts.map((b) => (
            <div
              key={b.id}
              className="card-base p-6 border-l-4 border-l-red-600 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                        🚨 Emergency Broadcast #{b.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        Radius: {b.radius_km || 25} km
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {b.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <SeverityBadge severity={b.severity} size="md" />
                  {hasRole(['admin', 'operator']) && (
                    <button
                      onClick={() => handleDelete(b.id, b.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                      title="Retract Broadcast"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
                {b.message}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Target Zone: <strong className="text-slate-800">{b.target_area}</strong>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Transmitted: {formatDate(b.created_at)} ({formatRelativeTime(b.created_at)})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Transmit Broadcast */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="📢 Transmit Civil Emergency Broadcast"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateBroadcast} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Broadcast Headline / Alert Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Mandatory Coastal Evacuation Directive"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Broadcast Severity *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="CRITICAL">CRITICAL (Immediate Action)</option>
                <option value="HIGH">HIGH (Severe Warning)</option>
                <option value="MEDIUM">MEDIUM (Advisory Watch)</option>
                <option value="LOW">LOW (Informational)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Broadcast Area *
              </label>
              <input
                type="text"
                required
                value={formData.target_area}
                onChange={(e) => setFormData({ ...formData, target_area: e.target.value })}
                placeholder="District / Zone"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Alert Directive & Safety Instructions *
            </label>
            <textarea
              rows={3}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="State clear, actionable emergency instructions for the general public..."
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
              className="px-5 py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Transmitting...' : 'Transmit Broadcast'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BroadcastsPage;
