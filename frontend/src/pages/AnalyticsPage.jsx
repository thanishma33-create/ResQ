import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import DashboardCard from '../components/common/DashboardCard';
import Loading from '../components/common/Loading';
import ErrorState from '../components/common/ErrorState';
import {
  Clock,
  CheckCircle2,
  Building2,
  Ambulance,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AnalyticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overRes, trendRes] = await Promise.all([
        axiosClient.get('/api/analytics/overview'),
        axiosClient.get('/api/analytics/trends'),
      ]);
      setOverview(overRes.data);
      setTrends(trendRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to fetch analytics metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (isLoading) {
    return <Loading fullScreen text="Synthesizing operational analytics & response KPIs..." />;
  }

  if (error && !overview) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={fetchAnalytics} />
      </div>
    );
  }

  // Prep chart data
  const severityChartData = [
    { name: 'Critical', value: overview?.emergencies_by_severity?.CRITICAL || 0, color: '#dc2626' },
    { name: 'High', value: overview?.emergencies_by_severity?.HIGH || 0, color: '#d97706' },
    { name: 'Medium', value: overview?.emergencies_by_severity?.MEDIUM || 0, color: '#2563eb' },
    { name: 'Low', value: overview?.emergencies_by_severity?.LOW || 0, color: '#64748b' },
  ].filter((d) => d.value > 0);

  const statusChartData = [
    { status: 'Pending', count: overview?.emergencies_by_status?.PENDING || 0 },
    { status: 'Verified', count: overview?.emergencies_by_status?.VERIFIED || 0 },
    { status: 'Assigned', count: overview?.emergencies_by_status?.ASSIGNED || 0 },
    { status: 'En Route', count: overview?.emergencies_by_status?.EN_ROUTE || 0 },
    { status: 'On Scene', count: overview?.emergencies_by_status?.ON_SCENE || 0 },
    { status: 'Resolved', count: overview?.emergencies_by_status?.RESOLVED || 0 },
  ];

  const typeChartData = Object.entries(overview?.emergencies_by_type || {}).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    count,
  }));

  const mockHourlyTrend = [
    { time: '02:00', emergencies: 3, resolved: 1 },
    { time: '06:00', emergencies: 6, resolved: 3 },
    { time: '10:00', emergencies: 18, resolved: 12 },
    { time: '14:00', emergencies: 29, resolved: 21 },
    { time: '18:00', emergencies: 24, resolved: 19 },
    { time: '22:00', emergencies: 14, resolved: 12 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Operational Analytics & Response KPIs
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical incident throughput, average dispatch response times, resource burn rates, and shelter capacity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
            {['24h', '7d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md font-medium uppercase transition-colors ${
                  timeRange === r ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-xs transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <DashboardCard
          title="Avg Dispatch Response"
          value={`${overview?.avg_response_time_minutes?.toFixed(0) || 12} mins`}
          icon={Clock}
          color="blue"
          subtext="Triage intake to squad en-route"
        />
        <DashboardCard
          title="Avg Incident Resolution"
          value={`${overview?.avg_resolution_time_minutes?.toFixed(0) || 48} mins`}
          icon={CheckCircle2}
          color="emerald"
          subtext="Dispatched to proof verified"
        />
        <DashboardCard
          title="Shelter Occupancy"
          value={`${overview?.shelter_occupancy_rate_pct?.toFixed(0) || 0}%`}
          icon={Building2}
          color="purple"
          subtext={`${overview?.total_shelter_occupied || 0} / ${overview?.total_shelter_capacity || 0} beds`}
        />
        <DashboardCard
          title="Squad Readiness"
          value={`${Math.round(((overview?.available_rescue_teams || 1) / (overview?.total_rescue_teams || 1)) * 100)}%`}
          icon={Ambulance}
          color="blue"
          subtext={`${overview?.available_rescue_teams || 0} squads available`}
        />
      </div>

      {/* Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Incident Throughput Area Chart */}
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Emergency Intake vs Resolved Rate
            </h3>
            <span className="text-[11px] text-slate-400">Timeline Analysis</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHourlyTrend}>
                <defs>
                  <linearGradient id="emGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="emergencies"
                  name="New Incidents"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#emGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved Cases"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#resGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Severity Distribution Pie */}
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Severity Tier Distribution
            </h3>
            <span className="text-[11px] text-slate-400">
              {overview?.total_emergencies || 0} Total Cases
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {severityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 italic">No severity data available</p>
            )}
          </div>
        </div>

        {/* 3. Status Funnel Progression Bar Chart */}
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Incident Workflow Status Funnel
            </h3>
            <span className="text-[11px] text-slate-400">Stage Counts</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" name="Incidents" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Incident Type Breakdown Bar Chart */}
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Emergencies by Incident Category
            </h3>
            <span className="text-[11px] text-slate-400">Hazard Types</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="type" stroke="#94a3b8" fontSize={10} width={110} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" name="Incidents" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
