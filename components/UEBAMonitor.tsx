import React from 'react';
import { SecurityEvent } from '../types';

interface UEBAMonitorProps {
  events: SecurityEvent[];
}

const UEBAMonitor: React.FC<UEBAMonitorProps> = ({ events }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-1/2">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold text-red-500 font-mono uppercase flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            UEBA Security Monitor
        </h3>
        <span className="px-2 py-0.5 bg-red-900/30 text-red-500 text-[10px] rounded border border-red-900/50">ACTIVE</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {events.length === 0 && (
            <div className="text-center text-slate-600 text-xs py-10">No anomalies detected.</div>
        )}
        {events.map(e => (
          <div key={e.id} className="bg-slate-950/50 p-2 rounded border-l-2 border-red-500 text-xs">
            <div className="flex justify-between text-slate-400 mb-1">
                <span>{e.timestamp.split('T')[1].split('.')[0]}</span>
                <span className="font-bold text-red-400">{e.severity}</span>
            </div>
            <div className="text-slate-200 font-mono mb-1">{e.description}</div>
            <div className="flex items-center gap-2">
                <span className="text-slate-500">Source: {e.source}</span>
                <span className="text-red-500 font-bold px-1 bg-red-900/20 rounded">[{e.action}]</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UEBAMonitor;
