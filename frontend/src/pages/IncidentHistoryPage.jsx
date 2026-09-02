import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import IncidentTimeline from '../components/timeline/IncidentTimeline';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatEmergencyType } from '../utils/formatters';
import {
  FileClock,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const IncidentHistoryPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [error, setError] = useState(null);

  // Load emergencies list
  useEffect(() => {
    const loadEmergencies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get('/api/emergencies/');
        setEmergencies(res.data);
        if (res.data.length > 0) {
          setSelectedEmergencyId(res.data[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load emergencies:', err);
        setError('Failed to fetch emergency incident records.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmergencies();
  }, []);

  // Fetch timeline for selected emergency
  const fetchTimeline = async (id) => {
    if (!id) return;
    setIsLoadingEvents(true);
    try {
      const res = await axiosClient.get(`/api/incidents/emergency/${id}`);
      setTimelineEvents(res.data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
      setTimelineEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (selectedEmergencyId) {
      fetchTimeline(selectedEmergencyId);
    }
  }, [selectedEmergencyId]);

  const selectedEmergency = emergencies.find((e) => e.id.toString() === selectedEmergencyId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Master Incident Event History
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              Lifecycle Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological audit timeline tracking dispatch states, proof uploads, resource allotments, and field actions.
          </p>
        </div>

        <button
          onClick={() => fetchTimeline(selectedEmergencyId)}
          className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-xs transition-colors self-start"
          title="Refresh Timeline"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Selector Card */}
      <div className="card-base p-5 space-y-3">
        <label className="block text-xs font-semibold text-slate-700">
          Select Emergency Incident to Inspect Timeline:
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedEmergencyId}
            onChange={(e) => setSelectedEmergencyId(e.target.value)}
            className="w-full sm:flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
          >
            {emergencies.map((em) => (
              <option key={em.id} value={em.id}>
                #{em.id} — {formatEmergencyType(em.emergency_type)} ({em.address} - {em.status})
              </option>
            ))}
          </select>

          {selectedEmergencyId && (
            <Link
              to={`/emergencies/${selectedEmergencyId}`}
              className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              Open Incident File <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Incident Summary Card if selected */}
      {selectedEmergency && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900">
              #{selectedEmergency.id} {formatEmergencyType(selectedEmergency.emergency_type)}
            </span>
            <p className="text-[11px] text-slate-600">{selectedEmergency.description}</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-blue-700 font-bold">{selectedEmergency.status}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">{selectedEmergency.people_affected || 1} victims</span>
          </div>
        </div>
      )}

      {/* Timeline Stream */}
      {isLoading || isLoadingEvents ? (
        <Loading text="Rendering chronological incident timeline..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchTimeline(selectedEmergencyId)} />
      ) : timelineEvents.length === 0 ? (
        <EmptyState
          icon={FileClock}
          title="No Incident Events Recorded"
          description="There are currently no recorded lifecycle events for this emergency incident."
        />
      ) : (
        <div className="card-base p-6 space-y-4">
          <IncidentTimeline events={timelineEvents} />
        </div>
      )}
    </div>
  );
};

export default IncidentHistoryPage;
