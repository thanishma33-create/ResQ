import React from 'react';
import {
  Compass,
  Flame,
  Shield,
  PhoneCall,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import NearbyAssistance from '../components/nearby/NearbyAssistance';

const NearbyAssistancePage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              📍 Nearby Assistance & Help Near Me
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              GPS Proximity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Locate active rescue squads, open relief shelters, and emergency supplies near your coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/sos"
            className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors flex items-center gap-2 animate-pulse"
          >
            <Flame className="w-4 h-4" />
            1-Click SOS
          </Link>
        </div>
      </div>

      {/* Main Nearby Assistance Component */}
      <NearbyAssistance />
    </div>
  );
};

export default NearbyAssistancePage;
