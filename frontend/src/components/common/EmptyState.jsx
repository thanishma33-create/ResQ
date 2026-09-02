import React from 'react';
import { PackageOpen, Plus } from 'lucide-react';

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There are no active records matching your criteria.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="card-base p-10 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <div className="max-w-md">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        {description && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
