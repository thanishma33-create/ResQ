import React from 'react';

const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PRIORITIZED: 'bg-purple-50 text-purple-700 border-purple-200',
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
  EN_ROUTE: 'bg-blue-50 text-blue-700 border-blue-200',
  ON_SCENE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BUSY: 'bg-red-50 text-red-700 border-red-200',
  FULL: 'bg-red-50 text-red-700 border-red-200',
  NEARLY_FULL: 'bg-amber-50 text-amber-700 border-amber-200',
  OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ACTIVE: 'bg-blue-50 text-blue-700 border-blue-200',
};

const StatusBadge = ({ status = 'PENDING', size = 'sm' }) => {
  const normalizedStatus = (status || 'PENDING').toUpperCase().replace(/\s+/g, '_');
  const style = STATUS_STYLES[normalizedStatus] || 'bg-slate-100 text-slate-700 border-slate-200';

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs font-semibold',
  }[size] || 'px-2.5 py-0.5 text-xs';

  const label = status ? status.replace(/_/g, ' ') : 'Pending';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${style} ${sizeClasses}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
