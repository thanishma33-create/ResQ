import React from 'react';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';

const LocationAccuracy = ({ accuracy }) => {
  if (accuracy === undefined || accuracy === null) return null;

  const accNum = typeof accuracy === 'number' ? accuracy : parseFloat(accuracy);

  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = 'High Accuracy';

  if (accNum > 50) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Approximate Fix';
  } else if (accNum > 25) {
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
    label = 'Good Accuracy';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${badgeColor}`}
      title={`GPS accuracy radius: ±${Math.round(accNum)} meters`}
    >
      <Target className="w-3.5 h-3.5" />
      <span>±{Math.round(accNum)} m ({label})</span>
    </div>
  );
};

export default LocationAccuracy;
