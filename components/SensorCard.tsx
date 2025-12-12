import React from 'react';
import { RiskLevel } from '../types';

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  isDanger?: boolean;
}

const SensorCard: React.FC<SensorCardProps> = ({ label, value, unit, icon, isDanger }) => {
  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${
      isDanger 
        ? 'bg-red-900/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
        : 'bg-slate-800 border-slate-700 shadow-md'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${isDanger ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-sky-400'}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${isDanger ? 'text-red-400' : 'text-slate-100'}`}>
          {value}
        </span>
        <span className="text-slate-500 text-sm font-semibold">{unit}</span>
      </div>
      
      {/* Mini sparkline or activity indicator simulation */}
      <div className="mt-4 h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
        <div 
            className={`h-full rounded-full ${isDanger ? 'bg-red-500 animate-pulse' : 'bg-sky-500'}`} 
            style={{ width: `${Math.min(100, Math.random() * 40 + 30)}%` }}
        />
      </div>
    </div>
  );
};

export default SensorCard;
