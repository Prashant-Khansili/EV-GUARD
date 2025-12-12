import React from 'react';

interface SafetyChecklistProps {
  isOpen: boolean;
  onClose: () => void;
}

const SafetyChecklist: React.FC<SafetyChecklistProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Driver Safety Checklist</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {[
            "Verify no warning lights are active on dashboard.",
            "Ensure battery temperature is below 45°C before fast charging.",
            "Check for physical damage or debris near charging port.",
            "Confirm current draw is steady during constant velocity.",
            "Inspect tires and brakes if sudden load changes occur.",
            "Keep emergency contact numbers accessible."
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-600 text-sky-500 focus:ring-sky-500 bg-slate-700" />
              <span className="text-slate-300">{item}</span>
            </div>
          ))}
        </div>
        <div className="p-6 bg-slate-900/50 border-t border-slate-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors"
          >
            Close Checklist
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyChecklist;
