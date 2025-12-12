import React from 'react';
import { HealthStatus } from '../types';

interface AlertPanelProps {
  status: HealthStatus;
}

const AlertPanel: React.FC<AlertPanelProps> = ({ status }) => {
  const isSafe = status.risk_level === 'SAFE';

  return (
    <div className={`h-full rounded-xl border p-6 flex flex-col justify-between ${
        isSafe 
        ? 'border-slate-700 bg-slate-800' 
        : status.risk_level === 'HIGH RISK' 
            ? 'border-red-500/50 bg-gradient-to-br from-slate-800 to-red-900/20' 
            : 'border-yellow-500/50 bg-gradient-to-br from-slate-800 to-yellow-900/10'
    }`}>
      <div>
        <div className="flex items-center gap-3 mb-4">
            {isSafe ? (
                 <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
                <svg className={`w-8 h-8 ${status.risk_level === 'HIGH RISK' ? 'text-red-500 animate-bounce' : 'text-yellow-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            )}
            <h3 className="text-xl font-bold text-white">System Diagnostics</h3>
        </div>

        <div className="mb-6">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Analysis Reason</h4>
            <p className={`text-lg leading-relaxed ${isSafe ? 'text-slate-300' : 'text-white'}`}>
                {status.reason}
            </p>
        </div>

        <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recommended Action</h4>
            <div className={`p-4 rounded-lg border ${
                isSafe 
                ? 'bg-slate-700/30 border-slate-600 text-slate-300' 
                : 'bg-black/30 border-white/10 text-white font-medium'
            }`}>
                {status.recommended_action}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AlertPanel;
