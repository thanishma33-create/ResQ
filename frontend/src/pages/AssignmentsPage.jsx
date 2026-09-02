import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatRelativeTime, formatEmergencyType } from '../utils/formatters';
import {
  Plus,
  Ambulance,
  Users,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ASSIGNMENT_STATUSES = ['PENDING', 'ACCEPTED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED', 'CANCELLED'];

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Create Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    emergency_id: '',
    role_type: 'RESCUE_TEAM',
    rescue_team_id: '',
    volunteer_id: '',
    instructions: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { hasRole } = useAuth();
  const { addToast, lastMessage } = useWebSocket();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assignRes, emRes, teamsRes, volRes] = await Promise.all([
        axiosClient.get('/api/assignments/'),
        axiosClient.get('/api/emergencies/'),
        axiosClient.get('/api/teams/'),
        axiosClient.get('/api/volunteers/'),
      ]);

      setAssignments(assignRes.data);
      setEmergencies(emRes.data);
      setTeams(teamsRes.data);
      setVolunteers(volRes.data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setError('Failed to load dispatch assignment data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (lastMessage?.event === 'ASSIGNMENT_CREATED' || lastMessage?.event === 'NEW_EMERGENCY') {
      fetchData();
    }
  }, [lastMessage]);

  const handleOpenCreate = () => {
    setFormData({
      emergency_id: emergencies[0]?.id || '',
      role_type: 'RESCUE_TEAM',
      rescue_team_id: teams[0]?.id || '',
      volunteer_id: volunteers[0]?.id || '',
      instructions: 'Proceed immediately to coordinates with required rescue apparatus.',
      notes: '',
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!formData.emergency_id) {
      setFormError('Please select an emergency incident.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const payload = {
      emergency_id: parseInt(formData.emergency_id, 10),
      role_type: formData.role_type,
      rescue_team_id: formData.role_type === 'RESCUE_TEAM' ? parseInt(formData.rescue_team_id, 10) : null,
      volunteer_id: formData.role_type === 'VOLUNTEER' ? parseInt(formData.volunteer_id, 10) : null,
      instructions: formData.instructions,
      notes: formData.notes,
    };

    try {
      await axiosClient.post('/api/assignments/', payload);
      addToast('Assignment Dispatched', `Unit dispatched to Incident #${formData.emergency_id}`, 'info');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error('Assignment failed:', err);
      setFormError(err.response?.data?.detail || 'Failed to create assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (assignmentId, newStatus) => {
    try {
      await axiosClient.patch(`/api/assignments/${assignmentId}/status`, {
        status: newStatus,
        notes: `Status updated to ${newStatus}`,
      });
      addToast('Assignment Updated', `Status updated to ${newStatus}`, 'info');
      fetchData();
    } catch (err) {
      console.error(err);
      addToast('Update Failed', 'Failed to update assignment status.', 'danger');
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (!statusFilter) return true;
    return a.status === statusFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Request Assignment & Workflow Board
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              {assignments.length} Dispatches
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational task dispatching to specialized rescue squads and volunteer field responders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
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
              Dispatch Assignment
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
          All Dispatches ({assignments.length})
        </button>
        {ASSIGNMENT_STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === st
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st} ({assignments.filter((a) => a.status === st).length})
          </button>
        ))}
      </div>

      {/* Assignments Grid */}
      {isLoading ? (
        <Loading text="Loading mission assignments..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          title="No Active Assignments"
          description="There are currently no unit assignments in this state."
          actionLabel="Dispatch New Unit"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((a) => (
            <div
              key={a.id}
              className="card-base p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {a.role_type}
                    </span>
                    <Link
                      to={`/emergencies/${a.emergency_id}`}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Emergency #{a.emergency_id}
                    </Link>
                  </div>
                  <StatusBadge status={a.status} size="sm" />
                </div>

                {/* Assigned Target info */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    {a.role_type === 'RESCUE_TEAM' ? (
                      <Ambulance className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Users className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>
                      {a.rescue_team?.name || a.volunteer?.name || `Assigned Unit #${a.rescue_team_id || a.volunteer_id}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Phone: {a.rescue_team?.contact_phone || a.volunteer?.phone || 'N/A'}
                  </p>
                </div>

                {a.instructions && (
                  <div className="text-xs text-slate-700">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Directives:
                    </span>
                    <p className="mt-0.5 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {a.instructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Status change actions & time */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <span className="text-[10px] text-slate-400">
                  {formatRelativeTime(a.assigned_at || a.created_at)}
                </span>

                {hasRole(['admin', 'operator', 'rescue_team']) && (
                  <select
                    value={a.status}
                    onChange={(e) => handleStatusChange(a.id, e.target.value)}
                    className="bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    {ASSIGNMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Dispatch New Assignment */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Unit Dispatch Assignment"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Incident to Respond *
            </label>
            <select
              value={formData.emergency_id}
              onChange={(e) => setFormData({ ...formData, emergency_id: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {emergencies.map((em) => (
                <option key={em.id} value={em.id}>
                  #{em.id} - {formatEmergencyType(em.emergency_type)} ({em.address} - {em.severity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatch Resource Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role_type: 'RESCUE_TEAM' })}
                className={`py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${
                  formData.role_type === 'RESCUE_TEAM'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Ambulance className="w-4 h-4" />
                Rescue Squad
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role_type: 'VOLUNTEER' })}
                className={`py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${
                  formData.role_type === 'VOLUNTEER'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
                Volunteer Responder
              </button>
            </div>
          </div>

          {formData.role_type === 'RESCUE_TEAM' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Rescue Team Squad *
              </label>
              <select
                value={formData.rescue_team_id}
                onChange={(e) => setFormData({ ...formData, rescue_team_id: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialty}) — Status: {t.status}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Volunteer Responder *
              </label>
              <select
                value={formData.volunteer_id}
                onChange={(e) => setFormData({ ...formData, volunteer_id: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.skills?.join(', ')}) — Status: {v.availability}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tactical Instructions & Directive
            </label>
            <textarea
              rows={2}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Deploy with inflatable boats and medical triage kit."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
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
              {isSubmitting ? 'Dispatching...' : 'Confirm & Dispatch Unit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssignmentsPage;
