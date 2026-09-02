import React from 'react';

const SEVERITY_STYLES = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
};

const SeverityBadge = ({ severity = 'LOW', size = 'sm', pulse = false }) => {
  const upperSeverity = (severity || 'LOW').toUpperCase();
  const style = SEVERITY_STYLES[upperSeverity] || SEVERITY_STYLES.LOW;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs font-semibold',
  }[size] || 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${style} ${sizeClasses} ${
        pulse && upperSeverity === 'CRITICAL' ? 'animate-pulse' : ''
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          upperSeverity === 'CRITICAL'
            ? 'bg-red-600'
            : upperSeverity === 'HIGH'
            ? 'bg-amber-600'
            : upperSeverity === 'MEDIUM'
            ? 'bg-blue-600'
            : 'bg-slate-500'
        }`}
      />
      {upperSeverity}
    </span>
  );
};

export default SeverityBadge;
