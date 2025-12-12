import React, { useRef, useEffect } from 'react';
import { AgentLog } from '../types';

interface AgentLogConsoleProps {
  logs: AgentLog[];
}

const AgentLogConsole: React.FC<AgentLogConsoleProps> = ({ logs }) => {
  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
           <h3 className="text-xs font-bold text-cyan-400 font-mono uppercase">Neural Core // Agent Orchestration Log</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">LIVE_STREAM</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs custom-scrollbar bg-black/40">
        {logs.length === 0 && <span className="text-slate-600">Waiting for agent activity...</span>}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-slate-600 min-w-[70px]">{log.timestamp.split('T')[1].split('.')[0]}</span>
            <span className={`font-bold min-w-[90px] ${
              log.agent === 'MASTER' ? 'text-purple-400' :
              log.agent === 'DIAGNOSIS' ? 'text-blue-400' :
              log.agent === 'SCHEDULING' ? 'text-green-400' :
              log.agent === 'SECURITY' ? 'text-red-500' : 'text-slate-400'
            }`}>[{log.agent}]</span>
            <span className={`flex-1 ${
                log.type === 'ALERT' ? 'text-red-400' :
                log.type === 'SUCCESS' ? 'text-green-400' : 'text-slate-300'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentLogConsole;
