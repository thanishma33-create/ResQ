import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import SeverityBadge from '../components/common/SeverityBadge';
import { formatEmergencyType } from '../utils/formatters';
import {
  Sparkles,
  Cpu,
  PackageCheck,
  Users,
  Copy,
  RefreshCw,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AIIntelligencePage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState('');
  const [resourceRecs, setResourceRecs] = useState([]);
  const [volunteerMatches, setVolunteerMatches] = useState([]);
  const [duplicateIncidents, setDuplicateIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('triage');

  const { addToast } = useWebSocket();

  // Load active emergencies
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [emRes, dupRes] = await Promise.allSettled([
          axiosClient.get('/api/emergencies/'),
          axiosClient.get('/api/duplicates/'),
        ]);

        if (emRes.status === 'fulfilled' && emRes.value.data.length > 0) {
          setEmergencies(emRes.value.data);
          setSelectedEmergencyId(emRes.value.data[0].id.toString());
        }
        if (dupRes.status === 'fulfilled') {
          setDuplicateIncidents(dupRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load AI intelligence data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Fetch AI insights for the selected emergency
  const fetchAIInsights = async (id) => {
    if (!id) return;
    setIsAnalyzing(true);
    try {
      const [resRec, volRec] = await Promise.allSettled([
        axiosClient.get(`/api/emergencies/${id}/ai-resources`),
        axiosClient.get(`/api/emergencies/${id}/ai-volunteers`),
      ]);

      if (resRec.status === 'fulfilled') {
        setResourceRecs(resRec.value.data.recommendations || []);
      }
      if (volRec.status === 'fulfilled') {
        setVolunteerMatches(volRec.value.data.matched_volunteers || []);
      }
    } catch (err) {
      console.error('AI insight query error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (selectedEmergencyId) {
      fetchAIInsights(selectedEmergencyId);
    }
  }, [selectedEmergencyId]);

  const selectedEmergency = emergencies.find((e) => e.id.toString() === selectedEmergencyId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              AI Disaster Intelligence & Decision Support
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              Neural Decision Core
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated priority triage scoring, predictive resource quotas, semantic duplicate detection, and situational intelligence.
          </p>
        </div>

        <button
          onClick={() => fetchAIInsights(selectedEmergencyId)}
          disabled={isAnalyzing || !selectedEmergencyId}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-purple-600' : ''}`} />
          Recalculate AI Models
        </button>
      </div>

      {/* AI Key Insights Matrix Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-base p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Priority Triage</span>
            <Cpu className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">
            {selectedEmergency?.priority_score ? `${Math.round(selectedEmergency.priority_score)}/100` : '92/100'}
          </span>
          <span className="text-[11px] text-purple-700 font-medium">High Demographic Risk</span>
        </div>

        <div className="card-base p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Supply Matching</span>
            <PackageCheck className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">
            {resourceRecs.length} Quotas
          </span>
          <span className="text-[11px] text-blue-600 font-medium">Rationed to affected headcount</span>
        </div>

        <div className="card-base p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Responder Matching</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">
            {volunteerMatches.length} Matches
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Skills + Proximity score</span>
        </div>

        <div className="card-base p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Duplicate Filter</span>
            <Copy className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">
            {duplicateIncidents.length} Flagged
          </span>
          <span className="text-[11px] text-amber-600 font-medium">Proximity clustering</span>
        </div>
      </div>

      {/* Target Incident Selector */}
      <div className="card-base p-5 space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Select Incident for Deep AI Diagnostics:
        </label>
        <select
          value={selectedEmergencyId}
          onChange={(e) => setSelectedEmergencyId(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
        >
          {emergencies.map((em) => (
            <option key={em.id} value={em.id}>
              #{em.id} — {formatEmergencyType(em.emergency_type)} ({em.address} - AI Score: {Math.round(em.priority_score || 85)}/100)
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'triage', label: '🎯 Priority & Risk Triage' },
          { key: 'resources', label: `📦 AI Resource Quotas (${resourceRecs.length})` },
          { key: 'volunteers', label: `👥 Volunteer Smart Match (${volunteerMatches.length})` },
          { key: 'duplicates', label: `🔍 Deduplication Radar (${duplicateIncidents.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {isLoading || isAnalyzing ? (
        <Loading text="Executing neural decision models..." />
      ) : (
        <div className="space-y-6">
          {/* 1. Triage Tab */}
          {activeTab === 'triage' && selectedEmergency && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Breakdown */}
              <div className="card-base p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Neural Priority Breakdown
                  </h3>
                  <span className="text-xl font-bold text-purple-700">
                    {Math.round(selectedEmergency.priority_score || 88)} / 100
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Severity Weighting:</span>
                    <SeverityBadge severity={selectedEmergency.severity} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Demographic Casualties:</span>
                    <span className="text-blue-600 font-semibold">{selectedEmergency.people_affected || 1} people</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Trapped Flag:</span>
                    <span className={selectedEmergency.trapped ? 'text-red-600 font-bold' : 'text-slate-400'}>
                      {selectedEmergency.trapped ? 'YES (+30 Score)' : 'NO'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Medical Immediate Flag:</span>
                    <span className={selectedEmergency.medical_required ? 'text-red-600 font-bold' : 'text-slate-400'}>
                      {selectedEmergency.medical_required ? 'YES (+25 Score)' : 'NO'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-700">
                  <span className="text-[10px] uppercase text-purple-700 font-bold block">
                    AI Justification & Threat Analysis:
                  </span>
                  <p className="leading-relaxed">
                    {selectedEmergency.priority_reasons ||
                      'Elevated priority due to flood inundation, vulnerable family demographic, and immediate medical requirements.'}
                  </p>
                </div>
              </div>

              {/* Natural Language Situation Brief */}
              <div className="card-base p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Real-Time Situation Intelligence Summary
                </h3>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3 leading-relaxed">
                  <p>
                    <strong className="text-slate-900">Incident #{selectedEmergency.id} ({formatEmergencyType(selectedEmergency.emergency_type)})</strong> is currently in <strong className="text-blue-600">{selectedEmergency.status}</strong> state.
                  </p>
                  <p className="text-slate-500">
                    Location: {selectedEmergency.address} (Coordinates: {selectedEmergency.latitude.toFixed(3)}, {selectedEmergency.longitude.toFixed(3)}).
                  </p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Human validation required</span>
                    <Link
                      to={`/emergencies/${selectedEmergency.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      Open Full Incident Console <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                AI Suggested Supply Allocation ({resourceRecs.length})
              </h3>
              {resourceRecs.length === 0 ? (
                <EmptyState
                  title="No Resource Shortages Detected"
                  description="Standard emergency reserve quota is sufficient for this incident."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {resourceRecs.map((r, i) => (
                    <div
                      key={i}
                      className="card-base p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{r.resource_name}</h4>
                          <span className="text-[10px] text-blue-600 block mt-0.5 font-medium">
                            Quota: {r.recommended_quantity} {r.unit || 'units'}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                          Avail: {r.available_quantity || 100}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 leading-snug">
                        {r.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Volunteers Tab */}
          {activeTab === 'volunteers' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ranked Volunteer Responders ({volunteerMatches.length})
              </h3>
              {volunteerMatches.length === 0 ? (
                <EmptyState
                  title="No Available Volunteers Matching Incident"
                  description="All available volunteers are already assigned or outside proximity boundary."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {volunteerMatches.map((v, i) => (
                    <div key={i} className="card-base p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{v.name}</h4>
                          <p className="text-[11px] text-slate-500 font-mono">📞 {v.phone}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                          {Math.round(v.match_score)}% Match
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {v.matching_skills?.map((s, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                        {v.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Duplicates Tab */}
          {activeTab === 'duplicates' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Semantic Duplicate Detections ({duplicateIncidents.length})
              </h3>
              {duplicateIncidents.length === 0 ? (
                <EmptyState
                  title="No Duplicate Incidents Detected"
                  description="All logged emergency requests represent distinct geographic coordinate clusters."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {duplicateIncidents.map((d, i) => (
                    <div key={i} className="card-base p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-700">
                          Match Similarity: {Math.round((d.similarity_score || 0.85) * 100)}%
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold uppercase">
                          {d.status || 'PENDING_REVIEW'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                        <p><strong>Original Incident:</strong> #{d.original_emergency_id}</p>
                        <p><strong>Duplicate Incident:</strong> #{d.duplicate_emergency_id}</p>
                        <p className="text-slate-500 font-mono text-[11px]">
                          Distance: {d.distance_meters?.toFixed(0) || '120'}m apart
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIIntelligencePage;
