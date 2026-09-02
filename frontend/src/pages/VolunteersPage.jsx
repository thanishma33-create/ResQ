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
  MapPin,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SKILL_OPTIONS = [
  'First Aid & Triage',
  'Medical Doctor / Nurse',
  'Boat Operator / Marine',
  'Search & Rescue SAR',
  'Food & Relief Distribution',
  'Emergency Vehicle Driver',
  'Civil Engineering / Demolition',
  'Counseling & Trauma Support',
  'Ham Radio Operator',
];

const VolunteersPage = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skills: [],
    latitude: 8.5241,
    longitude: 76.9366,
    address: 'Kowdiar, Trivandrum',
    availability: 'AVAILABLE',
    max_tasks: 3,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { hasRole } = useAuth();
  const { addToast } = useWebSocket();

  const fetchVolunteers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/volunteers/');
      setVolunteers(res.data);
    } catch (err) {
      console.error('Failed to load volunteers:', err);
      setError('Failed to fetch volunteer network roster.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleOpenCreate = () => {
    setEditingVolunteer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      skills: ['First Aid & Triage'],
      latitude: 8.5241,
      longitude: 76.9366,
      address: 'Kowdiar, Trivandrum',
      availability: 'AVAILABLE',
      max_tasks: 3,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVolunteer(v);
    setFormData({
      name: v.name,
      email: v.email || '',
      phone: v.phone,
      skills: v.skills || [],
      latitude: v.latitude,
      longitude: v.longitude,
      address: v.address || '',
      availability: v.availability,
      max_tasks: v.max_tasks,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleToggleSkill = (skill) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setFormError('Please enter volunteer name and contact phone.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingVolunteer) {
        await axiosClient.put(`/api/volunteers/${editingVolunteer.id}`, formData);
        addToast('Volunteer Updated', `Profile for "${formData.name}" updated.`, 'info');
      } else {
        await axiosClient.post('/api/volunteers/', formData);
        addToast('Volunteer Enrolled', `Responder "${formData.name}" added to network.`, 'info');
      }
      setShowCreateModal(false);
      fetchVolunteers();
    } catch (err) {
      console.error('Volunteer submit error:', err);
      setFormError(err.response?.data?.detail || 'Failed to save volunteer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAvailabilityChange = async (volId, newStatus) => {
    try {
      await axiosClient.patch(`/api/volunteers/${volId}/availability?availability=${newStatus}`);
      addToast('Status Updated', `Volunteer status set to ${newStatus}`, 'info');
      fetchVolunteers();
    } catch (err) {
      console.error(err);
      addToast('Update Failed', 'Failed to change availability status.', 'danger');
    }
  };

  const filteredVolunteers = volunteers.filter((v) => {
    if (!availabilityFilter) return true;
    return v.availability === availabilityFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Community Volunteer Network
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              {volunteers.filter((v) => v.availability === 'AVAILABLE').length} Available
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered medical responders, rescue boat handlers, relief organizers, and specialized skill profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/volunteer-assignment"
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI Volunteer Match
          </Link>

          {hasRole(['admin', 'operator', 'volunteer']) && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Enroll Volunteer
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setAvailabilityFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            availabilityFilter === ''
              ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Volunteers ({volunteers.length})
        </button>
        {['AVAILABLE', 'BUSY', 'OFFLINE'].map((st) => (
          <button
            key={st}
            onClick={() => setAvailabilityFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              availabilityFilter === st
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st} ({volunteers.filter((v) => v.availability === st).length})
          </button>
        ))}
      </div>

      {/* Volunteer Grid */}
      {isLoading ? (
        <Loading text="Loading volunteer network..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchVolunteers} />
      ) : filteredVolunteers.length === 0 ? (
        <EmptyState
          title="No Volunteers Found"
          description="There are currently no volunteers matching this status."
          actionLabel="Enroll Volunteer"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVolunteers.map((v) => (
            <div
              key={v.id}
              className="card-base p-5 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{v.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {v.address || 'Trivandrum'}
                    </p>
                  </div>
                  <StatusBadge status={v.availability} size="sm" />
                </div>

                <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Phone:</span>
                    <span className="font-mono text-blue-600 font-semibold">{v.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Active Tasks:</span>
                    <span className="text-slate-800 font-medium">
                      {v.active_tasks_count || 0} / {v.max_tasks} max
                    </span>
                  </div>
                </div>

                {/* Skills Badges */}
                <div className="mt-3">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                    Specialized Skills:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {v.skills?.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status change actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {hasRole(['admin', 'operator', 'volunteer']) ? (
                  <select
                    value={v.availability}
                    onChange={(e) => handleQuickAvailabilityChange(v.id, e.target.value)}
                    className="bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BUSY">BUSY</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                ) : (
                  <span className="text-[11px] text-slate-400">Active Profile</span>
                )}

                {hasRole(['admin', 'operator']) && (
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    title="Edit Volunteer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Enroll / Edit Volunteer */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingVolunteer ? 'Update Volunteer Profile' : 'Enroll New Volunteer'}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Ananya Nair"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ananya@example.com"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Pattom, Trivandrum"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Skill Selector Matrix */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Volunteer Skill Tags:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map((skill) => {
                const isSelected = formData.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {skill}
                  </button>
                );
              })}
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
              {isSubmitting ? 'Saving...' : editingVolunteer ? 'Update Volunteer' : 'Enroll Volunteer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VolunteersPage;
