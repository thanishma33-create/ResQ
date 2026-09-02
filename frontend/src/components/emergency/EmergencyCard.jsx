import React from 'react';
import { Link } from 'react-router-dom';
import SeverityBadge from '../common/SeverityBadge';
import StatusBadge from '../common/StatusBadge';
import { formatEmergencyType, formatRelativeTime } from '../../utils/formatters';
import {
  MapPin,
  Users,
  AlertTriangle,
  Flame,
  Activity,
  ArrowRight,
  Baby,
} from 'lucide-react';

const EmergencyCard = ({ emergency, onAssign, showActions = true }) => {
  if (!emergency) return null;

  return (
    <div
      className={`card-base p-5 transition-all ${
        emergency.severity === 'CRITICAL' ? 'border-l-4 border-l-red-600' : ''
      }`}
    >
      {/* Header: ID, Type & Badges */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              #{emergency.id}
            </span>
            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
              {formatEmergencyType(emergency.emergency_type)}
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{emergency.address || `${emergency.latitude}, ${emergency.longitude}`}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <SeverityBadge severity={emergency.severity} size="sm" />
          <StatusBadge status={emergency.status} size="sm" />
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        {emergency.description}
      </p>

      {/* Vulnerabilities & Stats Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <div className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          <Users className="w-3 h-3 text-slate-500" />
          <span>{emergency.people_affected || 1} people</span>
        </div>

        {emergency.trapped && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            TRAPPED
          </span>
        )}

        {emergency.medical_required && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
            <Activity className="w-3 h-3 text-red-600" />
            Medical Req
          </span>
        )}

        {emergency.injured_persons > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            <Flame className="w-3 h-3 text-amber-600" />
            {emergency.injured_persons} Injured
          </span>
        )}

        {emergency.children > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            <Baby className="w-3 h-3 text-blue-600" />
            {emergency.children} Children
          </span>
        )}

        {emergency.elderly > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
            {emergency.elderly} Elderly
          </span>
        )}

        {emergency.priority_score > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            AI Score: {Math.round(emergency.priority_score)}
          </span>
        )}
      </div>

      {/* Footer: Time & Action Links */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px]">
          {formatRelativeTime(emergency.created_at)}
        </span>

        {showActions && (
          <div className="flex items-center gap-2">
            {onAssign && emergency.status === 'PENDING' && (
              <button
                onClick={() => onAssign(emergency)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                Assign
              </button>
            )}
            <Link
              to={`/emergencies/${emergency.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyCard;
