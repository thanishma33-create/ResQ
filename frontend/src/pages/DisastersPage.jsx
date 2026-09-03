import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import useCurrentLocation from '../hooks/useCurrentLocation';
import { getCurrentPosition } from '../services/locationService';
import MapView from '../components/map/MapView';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import SeverityBadge from '../components/common/SeverityBadge';
import {
  Plus,
  Flame,
  CloudRain,
  Wind,
  Mountain,
  Waves,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
} from 'lucide-react';

const DISASTER_TYPES = [
  { value: 'flood', label: 'Flood Event', icon: Waves },
  { value: 'cyclone', label: 'Cyclone / Hurricane', icon: Wind },
  { value: 'landslide', label: 'Landslide', icon: Mountain },
  { value: 'fire', label: 'Wildfire / Structural Fire', icon: Flame },
  { value: 'earthquake', label: 'Earthquake', icon: AlertTriangle },
  { value: 'tsunami', label: 'Tsunami Surge', icon: Waves },
  { value: 'storm', label: 'Severe Storm', icon: CloudRain },
];

const DisastersPage = () => {
  const { location: userGpsLocation } = useCurrentLocation();
  const [disasters, setDisasters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDisaster, setEditingDisaster] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'flood',
    description: '',
    affected_area: '',
    latitude: '',
    longitude: '',
    risk_level: 'high',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { hasRole } = useAuth();
  const { addToast } = useWebSocket();

  const fetchDisasters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/disasters/');
      setDisasters(res.data);
    } catch (err) {
      console.error('Failed to load disasters:', err);
      setError('Failed to load disaster event records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  const handleOpenCreate = async () => {
    setEditingDisaster(null);
    let initialLat = userGpsLocation?.lat || '';
    let initialLon = userGpsLocation?.lon || '';
    if (!initialLat) {
      try {
        const pos = await getCurrentPosition();
        initialLat = pos.lat;
        initialLon = pos.lon;
      } catch {}
    }

    setFormData({
      name: '',
      type: 'flood',
      description: '',
      affected_area: '',
      latitude: initialLat,
      longitude: initialLon,
      risk_level: 'high',
      is_active: true,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (disaster) => {
    setEditingDisaster(disaster);
    setFormData({
      name: disaster.name,
      type: disaster.type,
      description: disaster.description || '',
      affected_area: disaster.affected_area,
      latitude: disaster.latitude,
      longitude: disaster.longitude,
      risk_level: disaster.risk_level,
      is_active: disaster.is_active,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.affected_area) {
      setFormError('Please enter disaster name and affected area.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingDisaster) {
        await axiosClient.put(`/api/disasters/${editingDisaster.id}`, formData);
        addToast('Disaster Updated', `Event "${formData.name}" updated successfully.`, 'info');
      } else {
        await axiosClient.post('/api/disasters/', formData);
        addToast('Disaster Registered', `Active hazard "${formData.name}" recorded in matrix.`, 'warning');
      }
      setShowCreateModal(false);
      fetchDisasters();
    } catch (err) {
      console.error('Disaster submit error:', err);
      setFormError(err.response?.data?.detail || 'Failed to save disaster event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete disaster event "${name}"?`)) return;
    try {
      await axiosClient.delete(`/api/disasters/${id}`);
      addToast('Disaster Removed', `Event "${name}" deleted.`, 'info');
      fetchDisasters();
    } catch (err) {
      console.error(err);
      addToast('Delete Failed', err.response?.data?.detail || 'Failed to delete event.', 'danger');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Disaster Events & Hazard Zones
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              {disasters.filter((d) => d.is_active).length} Active Zones
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial tracking of active floods, cyclones, landslides, and containment perimeters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDisasters}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {hasRole(['admin', 'operator']) && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Register Hazard Event
            </button>
          )}
        </div>
      </div>

      {/* Geospatial Map Overview */}
      <div className="card-base p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Active Multi-Hazard Perimeter Radar
        </h3>
        <MapView height="360px" disasters={disasters} />
      </div>

      {/* Disaster Cards List */}
      {isLoading ? (
        <Loading text="Loading active disaster zones..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDisasters} />
      ) : disasters.length === 0 ? (
        <EmptyState
          title="No Active Disaster Events"
          description="There are currently no active registered disaster zones."
          actionLabel="Log Disaster Event"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {disasters.map((d) => (
            <div
              key={d.id}
              className={`card-base p-5 transition-all ${
                d.is_active ? 'border-l-4 border-l-amber-500' : 'opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    {d.type}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">{d.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {d.affected_area}
                  </p>
                </div>
                <SeverityBadge severity={d.risk_level} size="sm" />
              </div>

              <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                {d.description || 'Monitored hazard event with active perimeter alert.'}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px] font-mono">
                  {d.latitude.toFixed(2)}, {d.longitude.toFixed(2)}
                </span>

                {hasRole(['admin', 'operator']) && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="Edit Event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id, d.name)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Disaster */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingDisaster ? 'Edit Disaster Hazard' : 'Register Disaster Hazard'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Disaster Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Kerala Monsoon Flood Inundation 2026"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hazard Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {DISASTER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Risk Classification *
              </label>
              <select
                value={formData.risk_level}
                onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="critical">CRITICAL (Emergency Alert)</option>
                <option value="high">HIGH (Warning Issued)</option>
                <option value="medium">MEDIUM (Advisory Watch)</option>
                <option value="low">LOW (Informational)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Affected Geographic Area *
            </label>
            <input
              type="text"
              required
              value={formData.affected_area}
              onChange={(e) => setFormData({ ...formData, affected_area: e.target.value })}
              placeholder="e.g., Coastal Lowland River Flood Basin"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Center Latitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Center Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Hazard Directives
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="River levels rising rapidly. Mandatory evacuation orders in sector 4."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <span className="font-medium">Mark as Active Hazard Zone</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Saving...' : editingDisaster ? 'Update Hazard' : 'Register Hazard'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DisastersPage;
