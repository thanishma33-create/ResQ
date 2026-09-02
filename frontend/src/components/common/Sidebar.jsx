import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  AlertTriangle,
  CloudRain,
  Package,
  Users,
  Building2,
  Compass,
  Truck,
  HeartPulse,
  ClipboardList,
  Megaphone,
  Bell,
  BarChart3,
  FileText,
  History,
  Radio,
  RadioTower,
  X,
  Flame,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
        allowedRoles: ['admin', 'operator', 'rescue_team', 'volunteer', 'citizen'],
      },
      {
        id: 'nearby',
        name: 'Nearby Assistance',
        icon: Compass,
        path: '/nearby',
        allowedRoles: ['admin', 'operator', 'rescue_team', 'volunteer', 'citizen'],
      },
    ],
  },

  {
    title: 'Emergency Management',
    items: [
      {
        id: 'requests',
        name: 'Emergency Requests',
        icon: AlertTriangle,
        path: '/requests',
        allowedRoles: ['admin', 'operator', 'rescue_team', 'volunteer', 'citizen'],
      },
      {
        id: 'disasters',
        name: 'Disaster Events',
        icon: CloudRain,
        path: '/disasters',
        allowedRoles: ['admin', 'operator', 'rescue_team'],
      },
      {
        id: 'assignments',
        name: 'Assignments',
        icon: ClipboardList,
        path: '/assignments',
        allowedRoles: ['admin', 'operator', 'rescue_team', 'volunteer'],
      },
      {
        id: 'medical',
        name: 'Medical & Vulnerable',
        icon: HeartPulse,
        path: '/medical',
        allowedRoles: ['admin', 'operator', 'rescue_team', 'volunteer'],
      },
      {
        id: 'offline-queue',
        name: 'Offline SOS Queue',
        icon: HardDrive,
        path: '/offline-queue',
        allowedRoles: ['admin', 'operator', 'rescue_team', 'volunteer', 'citizen'],
      },
    ],
  },

  {
    title: 'Resources',
    items: [
      {
        id: 'resources',
        name: 'Resource Inventory',
        icon: Package,
        path: '/resources',
        allowedRoles: ['admin', 'operator', 'rescue_team'],
      },
      {
        id: 'volunteers',
        name: 'Volunteers',
        icon: Users,
        path: '/volunteers',
        allowedRoles: ['admin', 'operator'],
      },
      {
        id: 'teams',
        name: 'Rescue Teams',
        icon: Truck,
        path: '/teams',
        allowedRoles: ['admin', 'operator'],
      },
      {
        id: 'shelters',
        name: 'Shelter Operations',
        icon: Building2,
        path: '/shelters',
        allowedRoles: ['admin', 'operator', 'rescue_team', 'volunteer', 'citizen'],
      },
    ],
  },

  {
    title: 'Communication',
    items: [
      {
        id: 'alerts',
        name: 'Disaster Alerts',
        icon: Bell,
        path: '/alerts',
        allowedRoles: ['admin', 'operator', 'rescue_team', 'volunteer', 'citizen'],
      },
      {
        id: 'broadcast',
        name: 'Emergency Broadcast',
        icon: Megaphone,
        path: '/broadcast',
        allowedRoles: ['admin', 'operator'],
      },
      {
        id: 'notifications',
        name: 'Notifications',
        icon: Radio,
        path: '/notifications',
        allowedRoles: ['admin', 'operator', 'rescue_team', 'volunteer', 'citizen'],
      },
    ],
  },

  {
    title: 'Intelligence & Analytics',
    items: [
      {
        id: 'ai',
        name: 'AI Intelligence',
        icon: RadioTower,
        path: '/ai',
        allowedRoles: ['admin', 'operator', 'rescue_team'],
      },
      {
        id: 'analytics',
        name: 'Advanced Analytics',
        icon: BarChart3,
        path: '/analytics',
        allowedRoles: ['admin', 'operator'],
      },
      {
        id: 'history',
        name: 'Incident History',
        icon: History,
        path: '/history',
        allowedRoles: ['admin', 'operator', 'rescue_team'],
      },
      {
        id: 'audit',
        name: 'Audit Logs',
        icon: FileText,
        path: '/audit',
        allowedRoles: ['admin'],
      },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'citizen';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-200 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-black text-sm">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-white tracking-tight">ResQ</span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 rounded uppercase">
                  {userRole}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                Disaster Operations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links Scrollable Area */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-5 sidebar-menu">
          {menuItems.map((section) => {
            const visibleItems = section.items.filter((item) => {
              if (userRole === 'admin') return true;
              if (!item.allowedRoles) return true;
              return item.allowedRoles.includes(userRole);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {section.title}
                </h4>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        onClick={() => {
                          if (window.innerWidth < 1024 && onClose) onClose();
                        }}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-xs'
                              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Session Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex-shrink-0">
          <div className="px-3 py-2 rounded-lg bg-slate-800/60 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-slate-300 font-medium text-[11px] truncate">
                {user?.full_name || user?.username || 'User'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">
              {userRole}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
