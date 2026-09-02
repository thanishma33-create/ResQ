import React from 'react';
import {
  Sparkles,
  Package,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

const AIRecommendationPanel = ({
  resourceRecommendations = [],
  volunteerMatches = [],
  onAllocateResource,
  onAssignVolunteer,
  isLoading = false,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. AI Resource Recommendations */}
      <div className="glass-card p-5 rounded-2xl border border-cyan-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                AI Resource Quota Recommendation
              </h4>
              <p className="text-[11px] text-slate-400">
                Calculated based on victims, severity, and demographics. Requires operator approval.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            AI Optimized
          </span>
        </div>

        {resourceRecommendations.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No specific resource recommendations generated.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resourceRecommendations.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-100">
                      {item.resource_name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.category}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-800/40 p-1.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 block font-mono">Needed</span>
                      <span className="font-bold text-cyan-400 font-mono">
                        {item.recommended_quantity} {item.unit}
                      </span>
                    </div>
                    <div className="bg-slate-800/40 p-1.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 block font-mono">Available</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {item.available_quantity} {item.unit}
                      </span>
                    </div>
                    <div className="bg-slate-800/40 p-1.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 block font-mono">Shortage</span>
                      <span
                        className={`font-bold font-mono ${
                          item.shortage > 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {item.shortage > 0 ? `-${item.shortage}` : '0'}
                      </span>
                    </div>
                  </div>

                  {item.reason && (
                    <p className="mt-2 text-[10px] text-slate-400 leading-snug">
                      <span className="text-cyan-400 font-semibold">Reason:</span> {item.reason}
                    </p>
                  )}
                </div>

                {onAllocateResource && (
                  <button
                    type="button"
                    onClick={() => onAllocateResource(item)}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold bg-cyan-950 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    Confirm & Allocate Resource
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. AI Volunteer Matching */}
      <div className="glass-card p-5 rounded-2xl border border-purple-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                AI Volunteer Match Rankings
              </h4>
              <p className="text-[11px] text-slate-400">
                Ranked by required skills, Haversine proximity distance, and ETA.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Smart Match
          </span>
        </div>

        {volunteerMatches.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No suitable nearby volunteers found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {volunteerMatches.map((vol) => (
              <div
                key={vol.volunteer_id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-100">{vol.name}</h5>
                      <span className="text-[11px] font-mono text-slate-400">{vol.phone}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                        {vol.match_score ? vol.match_score.toFixed(0) : '85'}% Match
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      {vol.distance_km?.toFixed(1) || '3.2'} km
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      ~{Math.round(vol.eta_minutes || 10)} mins ETA
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {vol.matching_skills?.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>

                  {vol.reason && (
                    <p className="mt-2 text-[10px] text-slate-400 leading-snug">
                      <span className="text-purple-400 font-semibold">Match Insight:</span> {vol.reason}
                    </p>
                  )}
                </div>

                {onAssignVolunteer && (
                  <button
                    type="button"
                    onClick={() => onAssignVolunteer(vol)}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold bg-purple-950 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    Confirm & Dispatch Volunteer
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendationPanel;
