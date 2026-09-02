import React from 'react';
import { Link } from 'react-router-dom';
import SeverityBadge from '../common/SeverityBadge';
import StatusBadge from '../common/StatusBadge';
import { formatEmergencyType, formatRelativeTime } from '../../utils/formatters';
import {
  Users,
  ArrowRight,
} from 'lucide-react';

const EmergencyTable = ({ emergencies = [], onAssign }) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4">ID & Type</th>
            <th className="py-3 px-4">Location</th>
            <th className="py-3 px-4">Impact / Casualties</th>
            <th className="py-3 px-4">AI Score</th>
            <th className="py-3 px-4">Severity</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Reported</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {emergencies.map((em) => (
            <tr
              key={em.id}
              className={`hover:bg-slate-50/80 transition-colors ${
                em.severity === 'CRITICAL' ? 'bg-red-50/30' : ''
              }`}
            >
              <td className="py-3.5 px-4 font-medium">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                    #{em.id}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{formatEmergencyType(em.emergency_type)}</p>
                    {em.trapped && (
                      <span className="text-[10px] text-red-600 font-bold uppercase tracking-wide">
                        Trapped
                      </span>
                    )}
                  </div>
                </div>
              </td>

              <td className="py-3.5 px-4 max-w-[200px]">
                <p className="text-slate-700 font-medium truncate">{em.address}</p>
                <p className="text-[10px] font-mono text-slate-400">
                  {em.latitude.toFixed(4)}, {em.longitude.toFixed(4)}
                </p>
              </td>

              <td className="py-3.5 px-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                    <Users className="w-3 h-3 text-slate-500" />
                    {em.people_affected || 1}
                  </span>
                  {em.medical_required && (
                    <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                      Medical
                    </span>
                  )}
                  {em.injured_persons > 0 && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                      {em.injured_persons} Injured
                    </span>
                  )}
                </div>
              </td>

              <td className="py-3.5 px-4 font-mono font-bold">
                <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                  {em.priority_score ? Math.round(em.priority_score) : '--'}
                </span>
              </td>

              <td className="py-3.5 px-4">
                <SeverityBadge severity={em.severity} size="sm" />
              </td>

              <td className="py-3.5 px-4">
                <StatusBadge status={em.status} size="sm" />
              </td>

              <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                {formatRelativeTime(em.created_at)}
              </td>

              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                  {onAssign && em.status === 'PENDING' && (
                    <button
                      onClick={() => onAssign(em)}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      Assign
                    </button>
                  )}
                  <Link
                    to={`/emergencies/${em.id}`}
                    className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    title="View Details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmergencyTable;
