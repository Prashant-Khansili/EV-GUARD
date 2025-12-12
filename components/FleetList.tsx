import React from 'react';
import { Vehicle } from '../types';

interface FleetListProps {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const FleetList: React.FC<FleetListProps> = ({ vehicles, selectedId, onSelect }) => {
  return (
    <div className="h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Fleet ({vehicles.length})</h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {vehicles.map(v => (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            className={`w-full p-4 border-b border-slate-800/50 flex items-center justify-between transition-colors hover:bg-slate-800 ${
              selectedId === v.id ? 'bg-slate-800 border-l-4 border-l-cyan-500' : 'border-l-4 border-l-transparent'
            }`}
          >
            <div className="text-left">
              <div className="font-mono text-sm font-bold text-white">{v.id}</div>
              <div className="text-xs text-slate-500">{v.model}</div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              v.status === 'OPTIMAL' ? 'bg-green-500/10 text-green-400' :
              v.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400' :
              'bg-red-500/10 text-red-500 animate-pulse'
            }`}>
              {v.status}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FleetList;
