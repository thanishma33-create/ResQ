import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Navigation,
  MapPin,
  CheckCheck,
  XCircle,
  Ambulance,
  Users,
  Shield,
  Send,
  RefreshCw,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const WORKFLOW_STEPS = [
  { key: 'PENDING', label: 'Pending', icon: Clock, desc: 'Initial report filed' },
  { key: 'VERIFIED', label: 'Verified', icon: Shield, desc: 'Triage & location verified' },
  { key: 'ASSIGNED', label: 'Assigned', icon: Ambulance, desc: 'Unit dispatched' },
  { key: 'EN_ROUTE', label: 'En Route', icon: Navigation, desc: 'Response team moving' },
  { key: 'ON_SCENE', label: 'On Scene', icon: MapPin, desc: 'Arrived at incident' },
  { key: 'RESOLVED', label: 'Resolved', icon: CheckCheck, desc: 'Mission accomplished' },
];

const AssignmentPanel = ({
  currentStatus = 'PENDING',
  onUpdateStatus,
  isUpdating = false,
  canEdit = true,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [statusNotes, setStatusNotes] = useState('');

  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === currentStatus);

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (onUpdateStatus && selectedStatus !== currentStatus) {
      onUpdateStatus(selectedStatus, statusNotes);
      setStatusNotes('');
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
            Incident Dispatch Lifecycle Workflow
          </h4>
          <p className="text-[11px] text-slate-400">
            Real-time stage tracking from initial reporting through resolution.
          </p>
        </div>
        <StatusBadge status={currentStatus} size="sm" />
      </div>

      {/* Step Progress Bar */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-800 hidden sm:block">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
            style={{
              width: `${Math.max(0, (currentStepIndex / (WORKFLOW_STEPS.length - 1)) * 100)}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-2 relative z-10">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isFuture = idx > currentStepIndex;

            return (
              <div
                key={step.key}
                onClick={() => canEdit && setSelectedStatus(step.key)}
                className={`flex flex-col items-center text-center p-3 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-950/80 border border-cyan-500/50 shadow-glow'
                    : isCompleted
                    ? 'bg-emerald-950/20 border border-emerald-800/40 text-emerald-400'
                    : 'bg-slate-900/40 border border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-glow font-bold'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-mono font-bold tracking-tight ${
                    isCurrent
                      ? 'text-cyan-300'
                      : isCompleted
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operator Status Changer Form */}
      {canEdit && (
        <form
          onSubmit={handleStatusSubmit}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 font-semibold">
              Advance Incident Status:
            </span>
            <span className="text-xs font-mono text-cyan-400">
              Selected: <strong>{selectedStatus}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {WORKFLOW_STEPS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label} ({s.key})
                </option>
              ))}
              <option value="CANCELLED">Cancel Incident (CANCELLED)</option>
            </select>

            <input
              type="text"
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Status change notes / dispatch log..."
              className="sm:col-span-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isUpdating || selectedStatus === currentStatus}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating Workflow...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Apply Status Change
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AssignmentPanel;
