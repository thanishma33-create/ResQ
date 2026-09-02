import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading fullScreen text="Verifying ResQ credentials..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;
    const isAllowed = userRole === 'admin' || allowedRoles.includes(userRole);

    if (!isAllowed) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full card-base p-8 text-center space-y-5 shadow-sm border-slate-200">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">
                403 — Access Denied
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                You do not have administrative clearance to access this module.
                Required role: <strong className="font-mono text-slate-700">{allowedRoles.join(' or ')}</strong>.
              </p>
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-medium">
              Your Current Role: <span className="font-bold text-blue-600 uppercase">{userRole || 'CITIZEN'}</span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 border-t border-slate-100">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
              </Link>
              <button
                onClick={logout}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Switch Account
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
