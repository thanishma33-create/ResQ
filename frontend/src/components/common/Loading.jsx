import React from 'react';
import { Loader2, Radio } from 'lucide-react';

const Loading = ({ text = 'Loading operations data...', message, fullScreen = false }) => {
  const displayMessage = message || text;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
        <div className="text-center space-y-0.5">
          <span className="text-xs font-bold tracking-wider text-slate-800 uppercase block">
            ResQ Command Core
          </span>
          <p className="text-xs text-slate-500 font-medium">{displayMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-2.5">
      <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
      <p className="text-xs font-medium text-slate-500">{displayMessage}</p>
    </div>
  );
};

export { Loading };
export default Loading;
