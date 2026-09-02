import React from 'react';

const COLOR_MAP = {
  blue: {
    iconBg: 'bg-blue-50 text-blue-600',
  },
  cyan: {
    iconBg: 'bg-blue-50 text-blue-600',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  green: {
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
  },
  orange: {
    iconBg: 'bg-amber-50 text-amber-600',
  },
  rose: {
    iconBg: 'bg-red-50 text-red-600',
  },
  red: {
    iconBg: 'bg-red-50 text-red-600',
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-600',
  },
  default: {
    iconBg: 'bg-slate-100 text-slate-600',
  },
};

const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  onClick,
}) => {
  const styles = COLOR_MAP[color] || COLOR_MAP.default;

  return (
    <div
      onClick={onClick}
      className={`card-base p-5 transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>

        {Icon && (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 font-normal">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ml-auto ${
                trend > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
