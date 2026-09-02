import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

const AIPriorityBadge = ({ score = 0, severity = 'LOW', reasons = [] }) => {
  const getScoreColor = () => {
    if (score >= 80) return 'text-rose-400 bg-rose-950/80 border-rose-700 shadow-[0_0_15px_-3px_rgba(244,63,94,0.4)]';
    if (score >= 60) return 'text-amber-400 bg-amber-950/80 border-amber-700';
    if (score >= 40) return 'text-cyan-400 bg-cyan-950/80 border-cyan-700';
    return 'text-slate-400 bg-slate-900 border-slate-700';
  };

  return (
    <div className={`p-3.5 rounded-xl border ${getScoreColor()} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            AI Triage Score
          </span>
        </div>
        <span className="text-base font-black font-mono tracking-tight">
          {score.toFixed(0)} <span className="text-xs font-normal text-slate-400">/ 100</span>
        </span>
      </div>

      {reasons && reasons.length > 0 && (
        <div className="pt-2 border-t border-slate-700/50 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
            Triage Justifications:
          </p>
          <ul className="text-xs text-slate-300 space-y-0.5">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">•</span>
                <span className="text-[11px] leading-tight">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIPriorityBadge;
