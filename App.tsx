import React, { useState, useEffect } from 'react';
import { agentSystem } from './services/agentSystem';
import { Vehicle, AgentLog, SecurityEvent, DriverStatus } from './types';
import TelemetryPanel from './components/TelemetryPanel';
import AgentLogConsole from './components/AgentLogConsole';
import UEBAMonitor from './components/UEBAMonitor';
import ChatWidget from './components/ChatWidget';
import DriverCam from './components/DriverCam';
import UserProfile from './components/UserProfile';

const App: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>(agentSystem.driverStatus);
  const [isEmergency, setIsEmergency] = useState(false);
  const [incomingChat, setIncomingChat] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    setVehicles(agentSystem.vehicles);
    setSelectedId(agentSystem.vehicles[0].id);
  }, []);

  // Main Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const state = agentSystem.tick();
      setVehicles([...state.vehicles]);
      setLogs([...state.logs]);
      setEvents([...state.events]);
      setDriverStatus({...state.driver});
      setIsEmergency(state.emergency);
      if (state.chat) {
          setIncomingChat(state.chat);
      } else {
          setIncomingChat(null);
      }
    }, 1000); // 1s tick for smoother biometric updates

    return () => clearInterval(interval);
  }, []);

  // Voice Alert Logic
  useEffect(() => {
    if (isEmergency) {
      const speak = () => {
          // Cancel any existing speech to avoid queue buildup
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance("Danger. Driver fatigue detected. Wake up immediately. Emergency stopping engaged.");
          utterance.lang = 'en-US';
          utterance.rate = 1.1; 
          utterance.pitch = 1.1; 
          utterance.volume = 1.0;
          
          // Try to select a good voice
          const voices = window.speechSynthesis.getVoices();
          // Prefer Google US English or similar high-quality voices if available
          const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
          if (preferredVoice) utterance.voice = preferredVoice;

          window.speechSynthesis.speak(utterance);
      };

      speak();

      // Repeat alert every 5 seconds if emergency persists
      const alertInterval = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
              speak();
          }
      }, 5000);

      return () => {
          clearInterval(alertInterval);
          window.speechSynthesis.cancel();
      };
    } else {
        // Stop speaking immediately if emergency clears (user wakes up)
        window.speechSynthesis.cancel();
    }
  }, [isEmergency]);

  const handleToggleFatigue = () => {
      agentSystem.toggleDriverFatigue();
  };

  const handleRealtimeDriverUpdate = (status: DriverStatus) => {
      // Use processed status from agentSystem (which applies the buffer logic)
      const processedStatus = agentSystem.updateDriverStatus(status);
      
      // We update local state immediately for smoother UI response
      setDriverStatus(processedStatus);
      // Update emergency state immediately to prevent lag in UI when eyes open
      setIsEmergency(agentSystem.emergencyMode);
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedId) || null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 relative">
      
      {/* Emergency Overlay */}
      <div className={`fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center transition-opacity duration-300 ${isEmergency ? 'opacity-100' : 'opacity-0'}`}>
         <div className="absolute inset-0 bg-red-950/20 animate-pulse"></div>
         <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(239,68,68,0.5)]"></div>
         <div className="bg-red-600 text-white font-black text-6xl tracking-widest px-8 py-4 rotate-[-5deg] border-4 border-white shadow-2xl uppercase text-center">
            Emergency Takeover
         </div>
         <div className="mt-4 text-red-400 font-mono font-bold text-xl bg-black/80 px-4 py-2 rounded">
            MASTER AGENT CONTROLLING VEHICLE ID: {selectedId}
         </div>
         {agentSystem.sosTriggered && (
             <div className="mt-8 bg-black/90 p-4 border-2 border-red-500 rounded text-center animate-bounce">
                 <h2 className="text-2xl font-bold text-white mb-2">SOS PROTOCOL ACTIVE</h2>
                 <p className="text-red-400 font-mono">CONTACTING EMERGENCY SERVICES...</p>
                 <p className="text-slate-400 text-sm mt-1">Vehicle Halted. Engine Cut.</p>
             </div>
         )}
      </div>

      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 flex items-center px-4 md:px-6 justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            EG
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">EV-GUARD</h1>
            <span className="text-[10px] text-cyan-500 uppercase tracking-[0.2em] hidden sm:inline">Agentic Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className={`flex items-center gap-2 px-3 py-1 border rounded-full transition-colors duration-500 ${
               isEmergency ? 'bg-red-900 border-red-500' : 'bg-slate-900 border-slate-800'
           }`}>
              <div className={`w-2 h-2 rounded-full ${isEmergency ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></div>
              <span className={`text-xs font-bold ${isEmergency ? 'text-red-400' : 'text-green-500'}`}>
                  {isEmergency ? 'CRITICAL' : 'ACTIVE'}
              </span>
           </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <div className="max-w-7xl mx-auto space-y-4">
              
              {/* Top Row: Camera (Left) + Profile/Stats (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Driver Cam - Top Left on Desktop, Top on Mobile */}
                  <div className="md:col-span-4 lg:col-span-3 h-[280px] md:h-auto">
                      <DriverCam 
                        status={driverStatus} 
                        onToggleSim={handleToggleFatigue} 
                        onRealtimeUpdate={handleRealtimeDriverUpdate}
                      />
                  </div>
                  
                  {/* User Profile & Vitals - Right side */}
                  <div className="md:col-span-8 lg:col-span-9">
                      <UserProfile vehicle={selectedVehicle} driverStatus={driverStatus} />
                  </div>
              </div>

              {/* Middle Row: Telemetry Charts */}
              <div className="h-[300px] md:h-[350px] bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                  <TelemetryPanel vehicle={selectedVehicle} />
              </div>

              {/* Bottom Row: Logs & Security */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto md:h-[300px]">
                  <div className="h-[300px] md:h-full">
                      <AgentLogConsole logs={logs} />
                  </div>
                  <div className="h-[300px] md:h-full">
                      <UEBAMonitor events={events} />
                  </div>
              </div>
          </div>
      </div>

      {/* Floating AI Guide */}
      <ChatWidget selectedVehicle={selectedVehicle} incomingMessage={incomingChat} />
    </div>
  );
};

export default App;