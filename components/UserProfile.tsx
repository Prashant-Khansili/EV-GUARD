import React, { useState } from 'react';
import { Vehicle, DriverStatus, EmergencyContact } from '../types';
import { agentSystem } from '../services/agentSystem';

interface UserProfileProps {
  vehicle: Vehicle | null;
  driverStatus: DriverStatus;
}

const UserProfile: React.FC<UserProfileProps> = ({ vehicle, driverStatus }) => {
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>(agentSystem.emergencyContacts);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newPhone, setNewPhone] = useState('');

  if (!vehicle) return null;

  const safetyScore = Math.round((driverStatus.attention + (1 - driverStatus.eyeClosure) * 100) / 2);
  const isSpeeding = vehicle.telemetry.speed > 100;
  const isCritical = vehicle.status === 'CRITICAL';

  const handleAddContact = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName || !newPhone) return;

      agentSystem.addContact({
          name: newName,
          relation: newRelation || 'Friend',
          phone: newPhone
      });
      
      setContacts([...agentSystem.emergencyContacts]);
      setNewName('');
      setNewRelation('');
      setNewPhone('');
  };

  const handleDeleteContact = (id: string) => {
      agentSystem.removeContact(id);
      setContacts([...agentSystem.emergencyContacts]);
  };
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-6 h-full shadow-lg relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      {/* User Info Column */}
      <div className="flex items-center md:items-start gap-4 md:flex-col md:w-1/4 min-w-[150px] border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
         <div className="relative">
             <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                 <span className="text-2xl font-bold text-slate-500">{vehicle.owner.charAt(0)}</span>
             </div>
             <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 ${
                 safetyScore > 80 ? 'bg-green-500' : safetyScore > 50 ? 'bg-amber-500' : 'bg-red-500'
             }`}></div>
         </div>
         <div className="flex-1 w-full">
             <h2 className="text-lg font-bold text-white leading-tight">{vehicle.owner}</h2>
             <p className="text-xs text-slate-500 font-mono mt-1">LIC: {vehicle.id}-88X</p>
             <div className="mt-2 flex flex-col gap-2">
                <div className="text-xs font-mono text-cyan-500 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/50 inline-block w-fit">
                    SCORE: {safetyScore}/100
                </div>
                <button 
                    onClick={() => setShowContacts(true)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded transition-colors flex items-center gap-1 w-full justify-center md:justify-start"
                >
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Manage Contacts
                </button>
             </div>
         </div>
      </div>

      {/* Vitals & Warnings - The "Important Data" */}
      <div className="flex-1 flex flex-col justify-between">
          
          {/* Top Row: Vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Speed</div>
                  <div className={`text-2xl font-mono font-bold ${isSpeeding ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                      {vehicle.telemetry.speed.toFixed(0)} <span className="text-sm text-slate-600">km/h</span>
                  </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Battery</div>
                  <div className="text-2xl font-mono font-bold text-cyan-400">
                      87<span className="text-sm text-slate-600">%</span>
                  </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Temp</div>
                  <div className={`text-2xl font-mono font-bold ${vehicle.telemetry.batteryTemp > 40 ? 'text-amber-500' : 'text-green-400'}`}>
                      {vehicle.telemetry.batteryTemp.toFixed(0)}<span className="text-sm text-slate-600">°C</span>
                  </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</div>
                  <div className={`text-lg font-mono font-bold truncate ${
                      vehicle.status === 'OPTIMAL' ? 'text-green-500' : 'text-red-500'
                  }`}>
                      {vehicle.status}
                  </div>
              </div>
          </div>

          {/* Bottom Row: Warnings */}
          <div className="flex-1 bg-black/20 rounded-lg p-3 border border-slate-800/50 overflow-y-auto max-h-[100px] custom-scrollbar">
             {isSpeeding && (
                 <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-2 animate-pulse">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                     SPEED LIMIT EXCEEDED - SLOW DOWN
                 </div>
             )}
             {isCritical && (
                 <div className="flex items-center gap-2 text-red-500 text-xs font-bold mb-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     CRITICAL SYSTEM FAILURE DETECTED
                 </div>
             )}
             {driverStatus.emotion === 'DROWSY' && (
                 <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                     DRIVER FATIGUE - PULL OVER IMMEDIATELY
                 </div>
             )}
             {!isSpeeding && !isCritical && driverStatus.emotion !== 'DROWSY' && (
                 <div className="text-slate-500 text-xs flex items-center gap-2">
                     <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     No active warnings. Drive safely.
                 </div>
             )}
          </div>
      </div>

      {/* Contacts Modal */}
      {showContacts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                      <h3 className="text-white font-bold flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          Emergency Contacts
                      </h3>
                      <button onClick={() => setShowContacts(false)} className="text-slate-400 hover:text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  
                  <div className="p-4 bg-slate-900 space-y-4">
                      {/* List */}
                      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                          {contacts.length === 0 && <p className="text-slate-500 text-sm italic text-center py-4">No emergency contacts added.</p>}
                          {contacts.map(c => (
                              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700">
                                  <div>
                                      <div className="text-white font-bold text-sm">{c.name}</div>
                                      <div className="text-xs text-slate-400">{c.relation} • {c.phone}</div>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteContact(c.id)}
                                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                  >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                              </div>
                          ))}
                      </div>

                      {/* Add Form */}
                      <form onSubmit={handleAddContact} className="pt-4 border-t border-slate-800">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Add New Contact</h4>
                          <div className="space-y-2">
                              <input 
                                type="text" 
                                placeholder="Full Name" 
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
                              />
                              <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Relation (e.g. Spouse)" 
                                    value={newRelation}
                                    onChange={e => setNewRelation(e.target.value)}
                                    className="w-1/2 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Phone Number" 
                                    value={newPhone}
                                    onChange={e => setNewPhone(e.target.value)}
                                    className="w-1/2 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
                                  />
                              </div>
                              <button 
                                type="submit"
                                disabled={!newName || !newPhone}
                                className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-2 rounded transition-colors"
                              >
                                  Add Contact
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserProfile;