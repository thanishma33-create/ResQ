import React from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useWebSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4">
      {toasts.map((toast) => {
        let border = 'border-cyan-600/60 bg-cyan-950/90 text-cyan-200';
        let Icon = Info;

        if (toast.type === 'danger') {
          border = 'border-rose-600/70 bg-rose-950/95 text-rose-100 shadow-glow-danger';
          Icon = AlertCircle;
        } else if (toast.type === 'warning') {
          border = 'border-amber-600/60 bg-amber-950/95 text-amber-100';
          Icon = AlertTriangle;
        } else if (toast.type === 'success') {
          border = 'border-emerald-600/60 bg-emerald-950/95 text-emerald-100 shadow-glow-success';
          Icon = CheckCircle2;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${border} backdrop-blur-md shadow-2xl transition-all animate-slideUp`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold tracking-tight">{toast.title}</h4>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
