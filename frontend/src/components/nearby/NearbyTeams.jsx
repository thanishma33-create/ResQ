import React from 'react';
import {
  Ambulance,
  Users,
  Shield,
  Phone,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Wrench,
} from 'lucide-react';
import DistanceBadge from './DistanceBadge';

const NearbyTeams = ({ teams = [], onRequestTeam }) => {
  return (
    <div className="card-base p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Ambulance className="w-4 h-4 text-blue-600" />
            Rescue Teams & Squads Near You ({teams.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Specialized disaster response units, marine teams, and medical squads within range.
          </p>
        </div>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Ambulance className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">No rescue squads located within search radius.</p>
          <p className="text-[11px] text-slate-500">Expand your search radius to locate regional disaster response teams.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => {
            const isAvailable = team.status === 'AVAILABLE';
            const isBusy = team.status === 'BUSY';

            return (
              <div
                key={team.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{team.name}</h4>
                      <p className="text-[11px] text-blue-600 font-medium mt-0.5">{team.specialty}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isBusy
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {team.status}
                    </span>
                  </div>

                  <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{team.members_count || 6}</strong> Responders
                    </span>

                    <DistanceBadge distanceKm={team.distance_km} etaMinutes={team.eta_minutes} />
                  </div>

                  {/* Skills / Equipment Pills */}
                  {team.equipment && team.equipment.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {team.equipment.slice(0, 3).map((eq, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200"
                        >
                          🛠️ {eq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer & Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  {team.contact_phone && (
                    <a
                      href={`tel:${team.contact_phone}`}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1 font-mono"
                    >
                      <Phone className="w-3 h-3 text-blue-600" /> {team.contact_phone}
                    </a>
                  )}

                  {onRequestTeam && isAvailable && (
                    <button
                      onClick={() => onRequestTeam(team)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                    >
                      Dispatch Squad
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NearbyTeams;
