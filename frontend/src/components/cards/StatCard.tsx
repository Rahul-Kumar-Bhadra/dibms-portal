import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  description,
  className = ''
}) => {
  const changeColor = 
    changeType === 'positive' 
      ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
      : changeType === 'negative' 
      ? 'text-rose-600 bg-rose-50 border-rose-100' 
      : 'text-slate-500 bg-slate-50 border-slate-100';

  return (
    <div className={`enterprise-card p-5 flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          <div className="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">
            <Icon className="w-4.5 h-4.5" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
      </div>
      
      {(change || description) && (
        <div className="flex items-center space-x-2 mt-4">
          {change && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${changeColor}`}>
              {change}
            </span>
          )}
          {description && (
            <span className="text-[10px] text-slate-400 font-medium truncate">{description}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
