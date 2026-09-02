import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useWebSocket } from '../context/WebSocketContext';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { formatEmergencyType } from '../utils/formatters';
import {
  Sparkles,
  Compass,
  Clock,
  RefreshCw,
  Send,
} from 'lucide-react';

const VolunteerAssignmentPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState('');
  const [volunteerMatches, setVolunteerMatches] = useState([]);
  const [isLoadingEmergencies, setIsLoadingEmergencies] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [instructions, setInstructions] = useState('Report to coordinates for flood relief medical support.');
  const [assigningVolId, setAssigningVolId] = useState(null);

  const { addToast } = useWebSocket();

  // Load active emergencies
  useEffect(() => {
    const loadEmergencies = async () => {
      try {
        const res = await axiosClient.get('/api/emergencies/');
        setEmergencies(res.data);
        if (res.data.length > 0) {
          setSelectedEmergencyId(res.data[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load emergencies:', err);
      } finally {
        setIsLoadingEmergencies(false);
      }
    };

    loadEmergencies();
  }, []);

  // Fetch AI matches for selected emergency
  const fetchMatches = async (emergencyId) => {
    if (!emergencyId) return;
    setIsMatching(true);
    try {
      const res = await axiosClient.get(`/api/emergencies/${emergencyId}/ai-volunteers`);
      setVolunteerMatches(res.data.matched_volunteers || []);
    } catch (err) {
      console.error('AI match failed:', err);
      setVolunteerMatches([]);
    } finally {
      setIsMatching(false);
    }
  };

  useEffect(() => {
    if (selectedEmergencyId) {
      fetchMatches(selectedEmergencyId);
    }
  }, [selectedEmergencyId]);

  const handleDispatch = async (vol) => {
    setAssigningVolId(vol.volunteer_id);
    try {
      await axiosClient.post('/api/assignments/', {
        emergency_id: parseInt(selectedEmergencyId, 10),
        volunteer_id: vol.volunteer_id,
        role_type: 'VOLUNTEER',
        instructions: instructions || `Dispatched with AI match score ${vol.match_score?.toFixed(0)}%`,
      });

      addToast('Volunteer Dispatched', `${vol.name} dispatched to Incident #${selectedEmergencyId}`, 'info');
      fetchMatches(selectedEmergencyId);
    } catch (err) {
      console.error('Dispatch failed:', err);
      addToast('Dispatch Failed', err.response?.data?.detail || 'Failed to dispatch volunteer.', 'danger');
    } finally {
      setAssigningVolId(null);
    }
  };

  const selectedEmergency = emergencies.find((e) => e.id.toString() === selectedEmergencyId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              AI Volunteer Matching & Task Dispatch
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Smart Dispatch Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Skill-based scoring algorithm balancing Haversine proximity distance, ETA, and medical requirements.
          </p>
        </div>

        <button
          onClick={() => fetchMatches(selectedEmergencyId)}
          disabled={isMatching || !selectedEmergencyId}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isMatching ? 'animate-spin' : ''}`} />
          Rerun Matching Engine
        </button>
      </div>

      {/* Target Emergency Selector Card */}
      <div className="card-base p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Select Incident to Match Volunteers:
            </label>
            <select
              value={selectedEmergencyId}
              onChange={(e) => setSelectedEmergencyId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
            >
              {emergencies.map((em) => (
                <option key={em.id} value={em.id}>
                  #{em.id} — {formatEmergencyType(em.emergency_type)} ({em.address} - Severity: {em.severity})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Deployment Instructions:
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter specific instructions..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {selectedEmergency && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                Impact: {selectedEmergency.people_affected || 1} people
              </span>
              {selectedEmergency.medical_required && (
                <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-bold">
                  Medical Required
                </span>
              )}
            </div>
            <span className="text-slate-500 text-[11px]">
              Location: {selectedEmergency.address} ({selectedEmergency.latitude.toFixed(3)}, {selectedEmergency.longitude.toFixed(3)})
            </span>
          </div>
        )}
      </div>

      {/* AI Matches List */}
      {isMatching ? (
        <Loading text="Executing AI proximity and skill matching algorithm..." />
      ) : volunteerMatches.length === 0 ? (
        <EmptyState
          title="No Matching Volunteers Available"
          description="There are currently no available volunteers with matching skillsets or proximity."
        />
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            AI Ranked Volunteer Matches ({volunteerMatches.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {volunteerMatches.map((vol) => (
              <div
                key={vol.volunteer_id}
                className="card-base p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{vol.name}</h4>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">📞 {vol.phone}</p>
                    </div>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                      {vol.match_score ? Math.round(vol.match_score) : '85'}% Match
                    </span>
                  </div>

                  {/* Proximity & ETA */}
                  <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      <span>{vol.distance_km?.toFixed(1) || '3.5'} km</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{Math.round(vol.eta_minutes || 12)} mins ETA</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-3">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                      Matched Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {vol.matching_skills?.map((s, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium"
                        >
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Insight */}
                  {vol.reason && (
                    <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-blue-600 font-semibold">AI Insight:</span> {vol.reason}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDispatch(vol)}
                  disabled={assigningVolId === vol.volunteer_id}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {assigningVolId === vol.volunteer_id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Dispatching Volunteer...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Confirm & Dispatch Volunteer
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerAssignmentPage;
