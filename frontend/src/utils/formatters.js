/**
 * Utility functions for formatting dates, numbers, severity and statuses
 */

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const getSeverityColor = (severity = 'LOW') => {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return {
        bg: 'bg-rose-950/80',
        text: 'text-rose-400',
        border: 'border-rose-700/60',
        dot: 'bg-rose-500',
        badge: 'bg-gradient-to-r from-rose-900 to-red-950 text-rose-200 border-rose-600',
      };
    case 'HIGH':
      return {
        bg: 'bg-amber-950/70',
        text: 'text-amber-400',
        border: 'border-amber-700/60',
        dot: 'bg-amber-500',
        badge: 'bg-gradient-to-r from-amber-900 to-orange-950 text-amber-200 border-amber-600',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-cyan-950/60',
        text: 'text-cyan-400',
        border: 'border-cyan-700/50',
        dot: 'bg-cyan-400',
        badge: 'bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-200 border-cyan-700',
      };
    default: // LOW
      return {
        bg: 'bg-slate-900/60',
        text: 'text-slate-400',
        border: 'border-slate-700/50',
        dot: 'bg-slate-500',
        badge: 'bg-slate-800 text-slate-300 border-slate-700',
      };
  }
};

export const getStatusColor = (status = 'PENDING') => {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'VERIFIED':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    case 'ASSIGNED':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    case 'EN_ROUTE':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse';
    case 'ON_SCENE':
      return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
    case 'RESOLVED':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'CANCELLED':
      return 'bg-slate-800 text-slate-500 border-slate-700';
    case 'AVAILABLE':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'BUSY':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'OFFLINE':
      return 'bg-slate-800 text-slate-500 border-slate-700';
    case 'OPEN':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'FULL':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
};

export const formatEmergencyType = (type = '') => {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};
