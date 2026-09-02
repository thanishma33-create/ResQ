import React from 'react';
import {
  Clock,
  ShieldCheck,
  Ambulance,
  Navigation,
  MapPin,
  CheckCircle,
  Package,
  Camera,
  AlertCircle,
  User,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

const getEventIcon = (eventType = '') => {
  const type = eventType.toUpperCase();
  if (type.includes('CREATE') || type.includes('REPORT')) return { icon: AlertCircle, color: 'text-amber-400 bg-amber-950/80 border-amber-700' };
  if (type.includes('VERIF')) return { icon: ShieldCheck, color: 'text-sky-400 bg-sky-950/80 border-sky-700' };
  if (type.includes('PRIORIT')) return { icon: Clock, color: 'text-cyan-400 bg-cyan-950/80 border-cyan-700' };
  if (type.includes('ASSIGN')) return { icon: Ambulance, color: 'text-indigo-400 bg-indigo-950/80 border-indigo-700' };
  if (type.includes('ROUTE')) return { icon: Navigation, color: 'text-purple-400 bg-purple-950/80 border-purple-700' };
  if (type.includes('SCENE')) return { icon: MapPin, color: 'text-pink-400 bg-pink-950/80 border-pink-700' };
  if (type.includes('RESOURCE') || type.includes('ALLOCAT')) return { icon: Package, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-700' };
  if (type.includes('EVIDENCE') || type.includes('PHOTO')) return { icon: Camera, color: 'text-cyan-400 bg-cyan-950/80 border-cyan-700' };
  if (type.includes('RESOLV')) return { icon: CheckCircle, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-700' };
  return { icon: Clock, color: 'text-slate-400 bg-slate-800 border-slate-700' };
};

const IncidentTimeline = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-900/30 rounded-xl border border-slate-800">
        No incident timeline events recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {events.map((evt, idx) => {
        const { icon: Icon, color } = getEventIcon(evt.event_type);

        return (
          <div key={evt.id || idx} className="relative group">
            {/* Timeline node icon */}
            <div
              className={`absolute -left-6 top-0 w-6 h-6 rounded-full border flex items-center justify-center -translate-x-1/2 ${color}`}
            >
              <Icon className="w-3 h-3" />
            </div>

            {/* Content card */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 group-hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wide">
                  {evt.event_type.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {formatDate(evt.created_at)}
                </span>
              </div>

              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                {evt.description}
              </p>

              {evt.actor_name && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-1 text-[11px] text-slate-400">
                  <User className="w-3 h-3 text-cyan-400" />
                  <span>
                    Action by: <strong className="text-slate-200">{evt.actor_name}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IncidentTimeline;
