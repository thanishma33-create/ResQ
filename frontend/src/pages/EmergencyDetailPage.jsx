import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import SeverityBadge from '../components/common/SeverityBadge';
import StatusBadge from '../components/common/StatusBadge';
import AIPriorityBadge from '../components/ai/AIPriorityBadge';
import AIRecommendationPanel from '../components/ai/AIRecommendationPanel';
import AssignmentPanel from '../components/workflow/AssignmentPanel';
import EvidenceUploader from '../components/emergency/EvidenceUploader';
import IncidentTimeline from '../components/timeline/IncidentTimeline';
import MapView from '../components/map/MapView';
import Loading from '../components/common/Loading';
import ErrorState from '../components/common/ErrorState';
import { formatEmergencyType, formatDate, formatRelativeTime } from '../utils/formatters';
import {
  ArrowLeft,
  MapPin,
  Camera,
  FileText,
} from 'lucide-react';

const EmergencyDetailPage = () => {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const { addToast } = useWebSocket();

  const [emergency, setEmergency] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [resourceRecs, setResourceRecs] = useState([]);
  const [volunteerMatches, setVolunteerMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmergencyDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [emRes, evRes, timeRes, resRecRes, volMatchRes] = await Promise.allSettled([
        axiosClient.get(`/api/emergencies/${id}`),
        axiosClient.get(`/api/evidence/${id}`),
        axiosClient.get(`/api/incidents/emergency/${id}`),
        axiosClient.get(`/api/emergencies/${id}/ai-resources`),
        axiosClient.get(`/api/emergencies/${id}/ai-volunteers`),
      ]);

      if (emRes.status === 'fulfilled') {
        setEmergency(emRes.value.data);
      } else {
        throw new Error('Emergency not found');
      }

      if (evRes.status === 'fulfilled') {
        setEvidenceList(evRes.value.data);
      }
      if (timeRes.status === 'fulfilled') {
        setTimelineEvents(timeRes.value.data);
      }
      if (resRecRes.status === 'fulfilled') {
        setResourceRecs(resRecRes.value.data.recommendations || []);
      }
      if (volMatchRes.status === 'fulfilled') {
        setVolunteerMatches(volMatchRes.value.data.matched_volunteers || []);
      }
    } catch (err) {
      console.error('Failed to load emergency details:', err);
      setError('Unable to load emergency incident data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyDetails();
  }, [id]);

  const handleStatusChange = async (newStatus, notes) => {
    setIsUpdatingStatus(true);
    try {
      const res = await axiosClient.patch(`/api/emergencies/${id}/status`, {
        status: newStatus,
        notes: notes || `Status advanced to ${newStatus}`,
      });
      setEmergency(res.data);
      addToast('Status Updated', `Incident #${id} advanced to ${newStatus}`, 'info');
      // Refresh timeline
      const timeRes = await axiosClient.get(`/api/incidents/emergency/${id}`);
      setTimelineEvents(timeRes.data);
    } catch (err) {
      console.error('Failed to update status:', err);
      addToast('Update Failed', err.response?.data?.detail || 'Failed to update status', 'danger');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAllocateAIResource = async (item) => {
    try {
      const resourcesRes = await axiosClient.get('/api/resources/');
      const matched = resourcesRes.data.find(
        (r) => r.name.toLowerCase().includes(item.resource_name.toLowerCase()) || r.category === item.category
      );

      if (!matched) {
        addToast('Resource Not Found', `No registered stock for ${item.resource_name}`, 'warning');
        return;
      }

      await axiosClient.post('/api/resources/allocate', {
        emergency_id: parseInt(id, 10),
        resource_id: matched.id,
        allocated_quantity: Math.min(item.recommended_quantity, matched.available_quantity || item.recommended_quantity),
        notes: `AI Recommendation: ${item.reason}`,
      });

      addToast('Resource Allocated', `Dispatched ${item.recommended_quantity} ${item.unit} of ${item.resource_name}`, 'info');
      fetchEmergencyDetails();
    } catch (err) {
      console.error('Allocation error:', err);
      addToast('Allocation Failed', err.response?.data?.detail || 'Failed to allocate resource', 'danger');
    }
  };

  const handleAssignAIVolunteer = async (vol) => {
    try {
      await axiosClient.post('/api/assignments/', {
        emergency_id: parseInt(id, 10),
        volunteer_id: vol.volunteer_id,
        role_type: 'VOLUNTEER',
        instructions: `Dispatched based on AI Match (${vol.match_score?.toFixed(0)}%). Skills: ${vol.matching_skills?.join(', ')}`,
      });

      addToast('Volunteer Dispatched', `${vol.name} assigned to Emergency #${id}`, 'info');
      fetchEmergencyDetails();
    } catch (err) {
      console.error('Volunteer assignment failed:', err);
      addToast('Assignment Failed', err.response?.data?.detail || 'Failed to assign volunteer', 'danger');
    }
  };

  if (isLoading) {
    return <Loading fullScreen text={`Loading Emergency Incident #${id}...`} />;
  }

  if (error || !emergency) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={fetchEmergencyDetails} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/requests"
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                Incident #{emergency.id}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {formatEmergencyType(emergency.emergency_type)}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {emergency.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SeverityBadge severity={emergency.severity} size="md" />
          <StatusBadge status={emergency.status} size="md" />
        </div>
      </div>

      {/* Main Grid: Left Details & Workflow, Right Map & AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Lifecycle, Summary, AI Panels, Evidence, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Workflow Stepper */}
          <AssignmentPanel
            currentStatus={emergency.status}
            onUpdateStatus={handleStatusChange}
            isUpdating={isUpdatingStatus}
            canEdit={hasRole(['admin', 'operator', 'rescue_team'])}
          />

          {/* 2. Situation Overview Card */}
          <div className="card-base p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Incident Narrative & Demographics
            </h3>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              {emergency.description}
            </p>

            {/* Impact Demographics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">People Affected</span>
                <span className="text-base font-bold text-slate-900">
                  {emergency.people_affected || 1}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Injured Persons</span>
                <span className="text-base font-bold text-red-600">
                  {emergency.injured_persons || 0}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Children / Minors</span>
                <span className="text-base font-bold text-blue-600">
                  {emergency.children || 0}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Elderly Citizens</span>
                <span className="text-base font-bold text-purple-600">
                  {emergency.elderly || 0}
                </span>
              </div>
            </div>

            {/* Reporter Information */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-3 border-t border-slate-100 text-slate-500">
              <span>
                Reported by: <strong className="text-slate-800">{emergency.reporter_name || 'Anonymous Citizen'}</strong>
              </span>
              <span>
                Phone: <strong className="text-slate-800">{emergency.reporter_phone || 'N/A'}</strong>
              </span>
              <span>
                Logged: {formatDate(emergency.created_at)} ({formatRelativeTime(emergency.created_at)})
              </span>
            </div>
          </div>

          {/* 3. AI Triage & Recommendation Engine */}
          <AIRecommendationPanel
            resourceRecommendations={resourceRecs}
            volunteerMatches={volunteerMatches}
            onAllocateResource={handleAllocateAIResource}
            onAssignVolunteer={handleAssignAIVolunteer}
          />

          {/* 4. Proof of Resolution & Uploaded Evidence Gallery */}
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                Proof of Resolution Evidence Gallery ({evidenceList.length})
              </h3>
            </div>

            <EvidenceUploader
              emergencyId={emergency.id}
              onEvidenceUploaded={(newEv) => {
                setEvidenceList((prev) => [newEv, ...prev]);
                addToast('Evidence Added', 'Proof of resolution logged.', 'info');
              }}
            />

            {evidenceList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <img
                      src={`http://127.0.0.1:8000${ev.file_path}`}
                      alt={ev.description || 'Resolution Photo'}
                      className="w-full h-40 object-cover rounded-lg bg-slate-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">{ev.description || 'Resolution Evidence'}</p>
                      {ev.resolution_notes && (
                        <p className="text-slate-600 mt-0.5 text-[11px]">{ev.resolution_notes}</p>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {formatDate(ev.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">
                No resolution evidence photos attached yet.
              </p>
            )}
          </div>

          {/* 5. Chronological Incident Audit Trail */}
          <div className="card-base p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Chronological Incident Event Trail
            </h3>
            <IncidentTimeline events={timelineEvents} />
          </div>
        </div>

        {/* Right Col: Map & Assigned Units */}
        <div className="space-y-6">
          {/* AI Priority Breakdown Badge */}
          <AIPriorityBadge
            score={emergency.priority_score || 75}
            severity={emergency.severity}
            reasons={emergency.priority_reasons || ['Critical affected population', 'Proximity to flood zone']}
          />

          {/* Mini Tactical Location Map */}
          <div className="card-base p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Incident Coordinates
            </h4>
            <MapView
              height="280px"
              center={[emergency.latitude, emergency.longitude]}
              zoom={14}
              emergencies={[emergency]}
            />
            <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono">
              <span>Lat: {emergency.latitude.toFixed(4)}</span>
              <span>Lon: {emergency.longitude.toFixed(4)}</span>
            </div>
          </div>

          {/* Assigned Field Unit Card */}
          {emergency.assigned_team && (
            <div className="card-base p-4 border-l-4 border-l-blue-600 space-y-2">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">
                Assigned Rescue Squadron
              </span>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{emergency.assigned_team.name}</h4>
                  <p className="text-xs text-slate-500">Lead: {emergency.assigned_team.team_leader}</p>
                </div>
                <StatusBadge status={emergency.assigned_team.status} size="sm" />
              </div>
              <p className="text-xs font-mono text-slate-600">
                📞 {emergency.assigned_team.contact_phone}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyDetailPage;
