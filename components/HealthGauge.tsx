import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { RiskLevel } from '../types';

interface HealthGaugeProps {
  score: number;
  riskLevel: RiskLevel;
}

const HealthGauge: React.FC<HealthGaugeProps> = ({ score, riskLevel }) => {
  
  let fill = '#22c55e'; // Green
  if (riskLevel === 'WARNING') fill = '#eab308'; // Yellow
  if (riskLevel === 'HIGH RISK') fill = '#ef4444'; // Red

  const data = [
    { name: 'Health', value: score, fill: fill }
  ];

  return (
    <div className="flex flex-col items-center justify-center relative h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="70%" 
          outerRadius="100%" 
          barSize={20} 
          data={data} 
          startAngle={180} 
          endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center">
        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">Health Score</p>
        <div className="flex items-baseline justify-center">
           <span className="text-6xl font-bold text-white tracking-tighter">{score}</span>
           <span className="text-xl text-slate-500 ml-1">/100</span>
        </div>
        <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
            riskLevel === 'SAFE' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
            riskLevel === 'WARNING' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
            'border-red-500/30 text-red-400 bg-red-500/10 animate-pulse'
        }`}>
            {riskLevel}
        </div>
      </div>
    </div>
  );
};

export default HealthGauge;
