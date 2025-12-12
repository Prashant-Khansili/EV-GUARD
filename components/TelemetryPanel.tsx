import React from 'react';
import { Vehicle } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TelemetryPanelProps {
  vehicle: Vehicle | null;
}

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ vehicle }) => {
  if (!vehicle) return <div className="flex-1 flex items-center justify-center text-slate-500">Select a vehicle</div>;

  const data = [
    { name: 'Speed', value: vehicle.telemetry.speed, max: 150, color: '#3b82f6' }, // Blue
    { name: 'Temp', value: vehicle.telemetry.batteryTemp, max: 100, color: vehicle.telemetry.batteryTemp > 50 ? '#ef4444' : '#22c55e' },
    { name: 'Vibration', value: vehicle.telemetry.vibration, max: 100, color: vehicle.telemetry.vibration > 40 ? '#eab308' : '#a855f7' },
    { name: 'Brake', value: vehicle.telemetry.brakeWear, max: 100, color: '#f97316' },
  ];

  return (
    <div className="flex flex-col h-full p-6">
       <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">{vehicle.model}</h2>
            <p className="text-slate-400 font-mono text-sm">OWNER: {vehicle.owner}</p>
            <p className="text-slate-500 text-xs mt-1">ID: {vehicle.id}</p>
          </div>
          <div className="text-right">
             <div className="text-4xl font-mono font-bold text-cyan-400">{vehicle.telemetry.speed.toFixed(0)} <span className="text-base text-slate-500">km/h</span></div>
             <div className={`text-sm font-bold mt-2 px-2 py-1 rounded inline-block ${
                 vehicle.status === 'OPTIMAL' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
             }`}>
                 SYSTEM: {vehicle.status}
             </div>
          </div>
       </div>

       <div className="flex-1 w-full min-h-[200px]">
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" domain={[0, 150]} hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                    cursor={{fill: '#1e293b'}}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
         </ResponsiveContainer>
       </div>

       {/* Manufacturing Insight (Simulated RCA) */}
       <div className="mt-4 p-3 bg-slate-900/50 border border-slate-800 rounded border-l-2 border-l-purple-500">
          <h4 className="text-[10px] uppercase text-purple-400 font-bold mb-1">Manufacturing Quality Feedback</h4>
          <p className="text-xs text-slate-300">
             Aggregated fleet analysis suggests <span className="text-white font-bold">Batch-A Brake Calipers</span> are showing premature wear (+15% deviation). Recommendation: Revise material composition for 2025 production run.
          </p>
       </div>
    </div>
  );
};

export default TelemetryPanel;
