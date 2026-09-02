import React from 'react';
import Modal from '../common/Modal';
import { Copy, AlertTriangle, ArrowRight, Check, X } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const DuplicateModal = ({
  isOpen,
  onClose,
  duplicates = [],
  onResolve,
  isResolving = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚠️ Potential Duplicate Emergencies Detected"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-300 leading-relaxed">
          The ResQ Proximity & AI Similarity Engine detected similar emergency reports reported within close geographic proximity and timeframe.
        </p>

        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
          {duplicates.map((dup) => (
            <div
              key={dup.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Duplicate Match #{dup.duplicate_emergency_id || dup.id}
                </span>
                <span className="font-mono text-amber-400 font-semibold">
                  {((dup.similarity_score || 0.85) * 100).toFixed(0)}% Similarity
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/40 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-mono block">Proximity Distance:</span>
                  <span className="font-bold text-slate-200">
                    {dup.distance_meters ? `${(dup.distance_meters / 1000).toFixed(2)} km` : '< 500m'}
                  </span>
                </div>
                <div className="bg-slate-800/40 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-mono block">Time Difference:</span>
                  <span className="font-bold text-slate-200">
                    {dup.time_diff_minutes ? `${Math.round(dup.time_diff_minutes)} mins` : '< 10 mins'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => onResolve(dup.id, 'SEPARATE')}
                  disabled={isResolving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Keep Separate
                </button>
                <button
                  type="button"
                  onClick={() => onResolve(dup.id, 'MERGED')}
                  disabled={isResolving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                >
                  Merge Incidents
                </button>
                <button
                  type="button"
                  onClick={() => onResolve(dup.id, 'CONFIRMED_DUPLICATE')}
                  disabled={isResolving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  Mark Duplicate
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DuplicateModal;
