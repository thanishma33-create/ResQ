import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({
  message = 'An unexpected system error occurred.',
  onRetry,
  title = 'System Error',
}) => {
  return (
    <div className="card-base p-8 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="max-w-md">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
