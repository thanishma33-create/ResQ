import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import {
  Plus,
  RefreshCw,
  Edit2,
} from 'lucide-react';

const SPECIALTIES = [
  'Water & Flood Rescue',
  'Medical & Triage Evacuation',
  'Structural Collapse & Heavy Urban SAR',
  'Marine & Coastal Rescue',
  'Canine Search Squad',
  'Fire & Hazardous Containment',
  'General Rapid Response',
];

const STATUSES = ['AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'BUSY', 'OFFLINE'];

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    team_leader: '',
    contact_phone: '',
    specialty: 'Water & Flood Rescue',
    latitude: 8.5241,
    longitude: 76.9366,
    base_location: 'Central NDRF Station, Trivandrum',
    status: 'AVAILABLE',
    max_capacity: 10,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { hasRole } = useAuth();
  const { addToast } = useWebSocket();

  const fetchTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/teams/');
      setTeams(res.data);
    } catch (err) {
      console.error('Failed to load rescue teams:', err);
      setError('Failed to fetch rescue team fleet records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setFormData({
      name: '',
      team_leader: '',
      contact_phone: '',
      specialty: 'Water & Flood Rescue',
      latitude: 8.5241,
      longitude: 76.9366,
      base_location: 'Central NDRF Station, Trivandrum',
      status: 'AVAILABLE',
      max_capacity: 10,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      team_leader: team.team_leader,
      contact_phone: team.contact_phone,
      specialty: team.specialty,
      latitude: team.latitude,
      longitude: team.longitude,
      base_location: team.base_location,
      status: team.status,
      max_capacity: team.max_capacity,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.team_leader || !formData.contact_phone) {
      setFormError('Please fill out all required team details.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingTeam) {
        await axiosClient.put(`/api/teams/${editingTeam.id}`, formData);
        addToast('Team Updated', `Squad "${formData.name}" updated successfully.`, 'info');
      } else {
        await axiosClient.post('/api/teams/', formData);
        addToast('Team Registered', `Rescue squad "${formData.name}" registered in fleet.`, 'info');
      }
      setShowCreateModal(false);
      fetchTeams();
    } catch (err) {
      console.error('Team submit error:', err);
      setFormError(err.response?.data?.detail || 'Failed to save team details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (teamId, newStatus) => {
    try {
      await axiosClient.put(`/api/teams/${teamId}`, { status: newStatus });
      addToast('Status Updated', `Team status set to ${newStatus}`, 'info');
      fetchTeams();
    } catch (err) {
      console.error(err);
      addToast('Update Failed', 'Failed to update team status.', 'danger');
    }
  };

  const filteredTeams = teams.filter((t) => {
    if (!statusFilter) return true;
    return t.status === statusFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Rescue Squads & Response Units
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              {teams.filter((t) => t.status === 'AVAILABLE').length} Available
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet tracking, readiness status, specialty skills, and active field assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTeams}
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
              Register Squad
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === ''
              ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Squads ({teams.length})
        </button>
        {STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === st
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st} ({teams.filter((t) => t.status === st).length})
          </button>
        ))}
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <Loading text="Loading rescue units..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTeams} />
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          title="No Rescue Units Found"
          description="There are currently no response teams matching the selected filter."
          actionLabel="Register New Squad"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((t) => (
            <div
              key={t.id}
              className={`card-base p-5 transition-all ${
                t.status === 'AVAILABLE'
                  ? 'border-l-4 border-l-emerald-500'
                  : t.status === 'EN_ROUTE'
                  ? 'border-l-4 border-l-blue-500'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 inline-block mt-1 border border-slate-200">
                    {t.specialty}
                  </span>
                </div>
                <StatusBadge status={t.status} size="sm" />
              </div>

              <div className="mt-3.5 space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Leader:</span>
                  <span className="font-semibold text-slate-800">{t.team_leader}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Contact:</span>
                  <span className="font-mono text-blue-600 font-semibold">{t.contact_phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Unit Size:</span>
                  <span className="font-bold text-slate-800">{t.max_capacity} Members</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 text-[11px]">Base:</span>
                  <span className="truncate max-w-[150px] text-[11px] text-slate-600">{t.base_location}</span>
                </div>
              </div>

              {/* Status change actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {hasRole(['admin', 'operator', 'rescue_team']) ? (
                  <select
                    value={t.status}
                    onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                    className="bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[11px] text-slate-400">Read Only</span>
                )}

                {hasRole(['admin', 'operator']) && (
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    title="Edit Squad"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create/Edit Team */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingTeam ? 'Edit Rescue Squad' : 'Register New Rescue Squad'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Squad Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="NDRF Battalion Alpha"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Team Leader *</label>
              <input
                type="text"
                required
                value={formData.team_leader}
                onChange={(e) => setFormData({ ...formData, team_leader: e.target.value })}
                placeholder="Capt. Rajesh Nair"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Squad Specialty *</label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {SPECIALTIES.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Base Deployment Station</label>
            <input
              type="text"
              value={formData.base_location}
              onChange={(e) => setFormData({ ...formData, base_location: e.target.value })}
              placeholder="Central Fire & Rescue Depot, Trivandrum"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Team Capacity</label>
              <input
                type="number"
                min={1}
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 10 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

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
              {isSubmitting ? 'Saving...' : editingTeam ? 'Update Squad' : 'Register Squad'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamsPage;
