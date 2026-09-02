import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import EmergencyCard from '../components/emergency/EmergencyCard';
import DashboardCard from '../components/common/DashboardCard';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import {
  HeartPulse,
  Baby,
  Users,
  Activity,
  Ambulance,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const MedicalVulnerablePage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState('ALL');

  const fetchVulnerableEmergencies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/emergencies/');
      const vulnerable = res.data.filter(
        (em) =>
          em.injured_persons > 0 ||
          em.children > 0 ||
          em.elderly > 0 ||
          em.pregnant_persons > 0 ||
          em.disabled_persons > 0 ||
          em.medical_required ||
          em.trapped
      );
      setEmergencies(vulnerable);
    } catch (err) {
      console.error('Failed to load vulnerable dispatches:', err);
      setError('Failed to load medical & vulnerability dispatches.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVulnerableEmergencies();
  }, []);

  const totalInjured = emergencies.reduce((acc, em) => acc + (em.injured_persons || 0), 0);
  const totalChildren = emergencies.reduce((acc, em) => acc + (em.children || 0), 0);
  const totalElderly = emergencies.reduce((acc, em) => acc + (em.elderly || 0), 0);
  const totalPregnant = emergencies.reduce((acc, em) => acc + (em.pregnant_persons || 0), 0);
  const totalMedicalCases = emergencies.filter((em) => em.medical_required).length;
  const totalTrapped = emergencies.filter((em) => em.trapped).length;

  const filteredList = emergencies.filter((em) => {
    if (vulnerabilityFilter === 'INJURED') return em.injured_persons > 0;
    if (vulnerabilityFilter === 'MEDICAL') return em.medical_required;
    if (vulnerabilityFilter === 'CHILDREN') return em.children > 0;
    if (vulnerabilityFilter === 'ELDERLY') return em.elderly > 0;
    if (vulnerabilityFilter === 'PREGNANT') return em.pregnant_persons > 0;
    if (vulnerabilityFilter === 'DISABLED') return em.disabled_persons > 0;
    if (vulnerabilityFilter === 'TRAPPED') return em.trapped;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Medical & Vulnerable Persons Queue
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-full">
              High Priority Triage
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated triage queue for injured victims, infants, senior citizens, pregnant persons, and trapped citizens.
          </p>
        </div>

        <button
          onClick={fetchVulnerableEmergencies}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 self-start shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh Triage
        </button>
      </div>

      {/* 6 Vulnerability KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <DashboardCard
          title="Injured Persons"
          value={totalInjured}
          icon={Activity}
          color="red"
          subtitle="Urgent care"
        />
        <DashboardCard
          title="Medical Cases"
          value={totalMedicalCases}
          icon={Ambulance}
          color="red"
          subtitle="Ambulance dispatch"
        />
        <DashboardCard
          title="Trapped Citizens"
          value={totalTrapped}
          icon={AlertTriangle}
          color="amber"
          subtitle="Rescue needed"
        />
        <DashboardCard
          title="Children / Infants"
          value={totalChildren}
          icon={Baby}
          color="blue"
          subtitle="Under 12 years"
        />
        <DashboardCard
          title="Elderly Citizens"
          value={totalElderly}
          icon={Users}
          color="purple"
          subtitle="65+ years"
        />
        <DashboardCard
          title="Pregnant Persons"
          value={totalPregnant}
          icon={HeartPulse}
          color="red"
          subtitle="Specialized care"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'ALL', label: `All High Risk (${emergencies.length})` },
          { key: 'MEDICAL', label: `Medical Needed (${totalMedicalCases})` },
          { key: 'INJURED', label: `Injured (${emergencies.filter((e) => e.injured_persons > 0).length})` },
          { key: 'TRAPPED', label: `Trapped (${totalTrapped})` },
          { key: 'CHILDREN', label: `Children (${emergencies.filter((e) => e.children > 0).length})` },
          { key: 'PREGNANT', label: `Pregnant (${emergencies.filter((e) => e.pregnant_persons > 0).length})` },
          { key: 'ELDERLY', label: `Elderly (${emergencies.filter((e) => e.elderly > 0).length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setVulnerabilityFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              vulnerabilityFilter === tab.key
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Emergency Grid */}
      {isLoading ? (
        <Loading text="Loading high-risk emergency dispatches..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchVulnerableEmergencies} />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="No Matching High-Risk Incidents"
          description="There are currently no active incidents matching the selected vulnerability filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((em) => (
            <EmergencyCard key={em.id} emergency={em} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalVulnerablePage;
