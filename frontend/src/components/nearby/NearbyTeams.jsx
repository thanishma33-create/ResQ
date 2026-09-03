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
  ShieldAlert,
} from 'lucide-react';
import DistanceBadge from './DistanceBadge';

const NearbyTeams = ({
  teams = [],
  onRequestTeam,
  onExpandRadius,
  radiusKm = 5,
}) => {
  // Sort teams: AVAILABLE first, then sorted by distance
  const sortedTeams = [...teams].sort((a, b) => {
    const aAvail = (a.status === 'AVAILABLE' || a.availability === 'AVAILABLE') ? 0 : 1;
    const bAvail = (b.status === 'AVAILABLE' || b.availability === 'AVAILABLE') ? 0 : 1;
    if (aAvail !== bAvail) return aAvail - bAvail;
    return (a.distance_km || 0) - (b.distance_km || 0);
  });

  return (
    <div className="card-base p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Ambulance className="w-4 h-4 text-sky-600" />
            Rescue Teams & Squads Near You ({teams.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Specialized disaster response units, marine teams, and medical squads within range.
          </p>
        </div>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
          <Ambulance className="w-8 h-8 text-slate-400 mx-auto" />
          <div>
            <p className="text-xs font-bold text-slate-700">🚑 No available rescue teams found nearby.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              No active disaster rescue teams were found within {radiusKm} km of your position.
            </p>
          </div>
          {onExpandRadius && (
            <button
              onClick={onExpandRadius}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Expand Search Radius</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedTeams.map((team) => {
            const isAvailable = team.status === 'AVAILABLE' || team.availability === 'AVAILABLE';
            const isBusy = team.status === 'BUSY' || team.availability === 'BUSY';

            return (
              <div
                key={team.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition-all shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{team.name}</h4>
                      <p className="text-[11px] text-sky-700 font-medium mt-0.5 capitalize">
                        Specialty: {team.specialty?.replace(/_/g, ' ') || 'Disaster Response'}
                      </p>
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
                      {team.status || team.availability || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{team.members_count || 6}</strong> Active Responders
                    </span>

                    <DistanceBadge distanceKm={team.distance_km} etaMinutes={team.eta_minutes} />
                  </div>

                  {/* Skills / Equipment Pills */}
                  {((team.equipment && team.equipment.length > 0) || (team.skills && team.skills.length > 0)) && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {team.skills?.map((sk, i) => (
                        <span
                          key={`sk-${i}`}
                          className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100"
                        >
                          ⚡ {sk}
                        </span>
                      ))}
                      {team.equipment?.map((eq, i) => (
                        <span
                          key={`eq-${i}`}
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
                  {team.contact_phone ? (
                    <a
                      href={`tel:${team.contact_phone}`}
                      className="text-xs font-semibold text-slate-700 hover:text-sky-600 flex items-center gap-1 font-mono"
                    >
                      <Phone className="w-3 h-3 text-sky-600" /> {team.contact_phone}
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">Squad ID: #{team.id}</span>
                  )}

                  {onRequestTeam && isAvailable && (
                    <button
                      onClick={() => onRequestTeam(team)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors cursor-pointer"
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
