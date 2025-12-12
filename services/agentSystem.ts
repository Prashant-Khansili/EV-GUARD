import { Vehicle, AgentLog, SecurityEvent, Insight, DriverStatus, EmergencyContact } from '../types';

// Mock Data
const OWNERS = ['Alice Chen', 'Bob Smith', 'Charlie Kim', 'Diana Prince', 'Evan Wright', 'Fiona Gallagher', 'George Miller', 'Hannah Lee', 'Ian Stark', 'Julia Roberts'];
const MODELS = ['Model X-Pro', 'CyberSedan', 'EcoHatch', 'Model X-Pro', 'CyberSedan', 'EcoHatch', 'Model X-Pro', 'CyberSedan', 'EcoHatch', 'HyperTruck'];

// Helper Randoms
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export class AgentSystem {
  vehicles: Vehicle[] = [];
  logs: AgentLog[] = [];
  securityEvents: SecurityEvent[] = [];
  insights: Insight[] = [];
  chatQueue: string[] = []; 
  
  // Driver Safety State
  driverStatus: DriverStatus = {
    attention: 98,
    eyeClosure: 0.0,
    headMovement: 1.5, // Default active
    emotion: 'FOCUSED',
    bpm: 75
  };

  // User Emergency Contacts
  emergencyContacts: EmergencyContact[] = [
    { id: '1', name: 'Sarah Chen', relation: 'Spouse', phone: '+1 (555) 012-3456' }
  ];
  
  // Emergency State
  emergencyMode = false;
  emergencyStartTimestamp = 0;
  sosTriggered = false;
  forcedDrowsy = false;
  
  // Real-time Override
  lastRealtimeUpdate = 0;
  
  // Buffer for eye tracking to prevent "blink" false positives
  drowsyCounter = 0;
  
  // Inactivity/Stillness Tracking
  stillnessStartTime = 0;
  // Threshold for head movement to be considered "still"
  private readonly STILLNESS_THRESHOLD = 0.3; 
  // Duration in ms to trigger SOS
  private readonly STILLNESS_TIMEOUT = 7000; 

  constructor() {
    this.initFleet();
  }

  initFleet() {
    this.vehicles = Array.from({ length: 10 }, (_, i) => ({
      id: `EV-${100 + i}`,
      model: MODELS[i],
      owner: OWNERS[i],
      status: 'OPTIMAL',
      telemetry: {
        speed: 0,
        batteryTemp: 25,
        vibration: 2,
        brakeWear: 10,
        timestamp: new Date().toISOString()
      }
    }));
  }

  // Manage Contacts
  addContact(contact: Omit<EmergencyContact, 'id'>) {
    const newContact = { ...contact, id: crypto.randomUUID() };
    this.emergencyContacts.push(newContact);
    this.addLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agent: 'SAFETY',
        type: 'INFO',
        message: `Contact List Updated: Added ${contact.name} (${contact.relation}).`
    });
  }

  removeContact(id: string) {
    this.emergencyContacts = this.emergencyContacts.filter(c => c.id !== id);
  }

  // Called by DriverCam when real computer vision detects something
  updateDriverStatus(realStatus: DriverStatus): DriverStatus {
      this.lastRealtimeUpdate = Date.now();
      
      // --- LOGIC 1: Eye Closure / Drowsiness ---
      const isEyesClosed = realStatus.eyeClosure > 0.6; // 0.0 is open, 1.0 is closed

      // Buffer Logic: Count continuous frames of eye closure
      if (isEyesClosed) {
          this.drowsyCounter++;
      } else {
          this.drowsyCounter = 0;
      }

      const THRESHOLD_FRAMES = 30; // ~3 seconds
      let finalEmotion = realStatus.emotion;

      if (finalEmotion === 'DROWSY' && this.drowsyCounter <= THRESHOLD_FRAMES) {
          finalEmotion = 'FOCUSED';
      }

      if (this.drowsyCounter > THRESHOLD_FRAMES && !this.emergencyMode) {
        this.emergencyMode = true;
        finalEmotion = 'DROWSY';
        this.triggerEmergencyProtocol();
      } 
      
      // --- LOGIC 2: Head Movement / Stillness Detection ---
      // If head movement is extremely low, start counting time
      if (realStatus.headMovement < this.STILLNESS_THRESHOLD) {
          if (this.stillnessStartTime === 0) {
              this.stillnessStartTime = Date.now();
          } else {
              const elapsed = Date.now() - this.stillnessStartTime;
              // If still for > 7 seconds
              if (elapsed > this.STILLNESS_TIMEOUT && !this.sosTriggered) {
                  // Trigger Emergency Mode if not already active
                  if (!this.emergencyMode) {
                      this.emergencyMode = true;
                      this.triggerEmergencyProtocol();
                  }
                  
                  // Immediately Trigger SOS Protocol
                  this.sosTriggered = true;
                  finalEmotion = 'DROWSY'; // Force status to Drowsy/Incapacitated
                  
                  this.addLog({
                      id: crypto.randomUUID(),
                      timestamp: new Date().toISOString(),
                      agent: 'SAFETY',
                      type: 'CRITICAL',
                      message: 'GUARDIAN AGENT: Complete driver inactivity detected (>7s). Assuming incapacitation.'
                  });
                  this.triggerSOSProtocol();
              }
          }
      } else {
          // Reset if movement detected
          this.stillnessStartTime = 0;
      }

      // --- LOGIC 3: Recovery ---
      // If user opens eyes AND moves head while in emergency (and SOS not fully locked in yet? 
      // Actually if SOS triggered, we usually keep it, but for demo we allow recovery if they wake up fast)
      // Let's make SOS sticky, but EmergencyMode recoverable if not SOS'd
      if (!isEyesClosed && realStatus.headMovement > this.STILLNESS_THRESHOLD && this.emergencyMode && !this.sosTriggered) {
          this.emergencyMode = false;
          this.drowsyCounter = 0; 
          
          this.addLog({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            agent: 'SAFETY',
            type: 'SUCCESS',
            message: 'GUARDIAN AGENT: Driver active. Emergency protocol deactivated.'
          });
      }

      this.driverStatus = {
          ...this.driverStatus,
          attention: realStatus.attention,
          eyeClosure: realStatus.eyeClosure,
          headMovement: realStatus.headMovement,
          emotion: finalEmotion
      };

      return this.driverStatus;
  }

  // Trigger for the simulation (Starts the decay process)
  toggleDriverFatigue() {
    this.forcedDrowsy = !this.forcedDrowsy;
    
    // If turning OFF simulation, reset immediately
    if (!this.forcedDrowsy) {
        this.emergencyMode = false;
        this.sosTriggered = false;
        this.drowsyCounter = 0;
        this.stillnessStartTime = 0;
        this.driverStatus = {
            attention: 95,
            eyeClosure: 0.0,
            headMovement: 1.5,
            emotion: 'FOCUSED',
            bpm: 75
        };
        this.addLog({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            agent: 'MASTER',
            type: 'INFO',
            message: 'Driver control restored. Resuming standard monitoring.'
        });
    } else {
        // Just log that test started, don't trigger emergency yet
        this.addLog({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            agent: 'SAFETY',
            type: 'INFO',
            message: 'GUARDIAN AGENT: Initiating fatigue simulation test sequence.'
        });
    }
  }

  // The "Heartbeat" of the system
  tick(): { vehicles: Vehicle[], logs: AgentLog[], events: SecurityEvent[], chat: string | null, driver: DriverStatus, emergency: boolean } {
    const now = new Date();
    let newChat: string | null = null;
    const newLogs: AgentLog[] = [];

    // --- SOS PROTOCOL CHECK ---
    // Standard Timeout Check: If emergency mode has been active for > 10 seconds (Total), trigger SOS
    // This is the fallback if head movement logic didn't trigger it earlier
    if (this.emergencyMode && !this.sosTriggered) {
        if (Date.now() - this.emergencyStartTimestamp > 10000) { // Extended to 10s to match prompt vibe
            this.triggerSOSProtocol();
            this.sosTriggered = true;
        }
    }

    // 1. Simulate Driver Biometrics (Progressive Decay)
    if (Date.now() - this.lastRealtimeUpdate > 2000) {
        if (this.forcedDrowsy) {
            const newEyeClosure = Math.min(1.0, this.driverStatus.eyeClosure + 0.3);
            let drop = 5;
            if (newEyeClosure > 0.3) drop = 15;
            if (newEyeClosure > 0.6) drop = 35;
            
            const newAttention = Math.max(0, this.driverStatus.attention - drop);
            const newBpm = Math.max(50, this.driverStatus.bpm - 1.5);

            let newEmotion: DriverStatus['emotion'] = 'FOCUSED';
            if (newAttention < 40 || newEyeClosure >= 0.8) {
                newEmotion = 'DROWSY';
            } else if (newAttention < 75 || newEyeClosure > 0.4) {
                newEmotion = 'DISTRACTED';
            }

            this.driverStatus = {
                attention: newAttention,
                eyeClosure: newEyeClosure,
                headMovement: 0.1, // Simulated stillness in forced drowsy
                emotion: newEmotion,
                bpm: newBpm
            };

            if (newEmotion === 'DROWSY' && !this.emergencyMode) {
                this.emergencyMode = true;
                this.triggerEmergencyProtocol();
            }

        } else {
            this.driverStatus = {
                attention: Math.min(100, Math.max(85, this.driverStatus.attention + rand(-2, 2))),
                eyeClosure: Math.max(0, Math.min(0.15, this.driverStatus.eyeClosure + rand(-0.05, 0.05))),
                headMovement: Math.max(0.5, rand(0.5, 3.0)), // Normal head movement
                emotion: 'FOCUSED',
                bpm: Math.min(90, Math.max(65, this.driverStatus.bpm + rand(-1, 1)))
            };
        }
    }

    // 2. Update Telemetry
    this.vehicles = this.vehicles.map(v => {
      let speed = v.telemetry.speed; // Preserve previous speed
      let batteryTemp = v.telemetry.batteryTemp;
      let vibration = v.telemetry.vibration;
      const isTargetVehicle = v.id === 'EV-100';

      if (this.emergencyMode && isTargetVehicle) {
          // EMERGENCY LOGIC
          if (this.sosTriggered) {
              // PHASE 2: SOS Triggered -> FORCE HALT
              speed = Math.max(0, speed * 0.5 - 10); // Rapid brake
              if (speed < 2) speed = 0; // Snap to 0

              if (speed === 0) {
                  vibration = 0; // No vibration when stopped
                  batteryTemp = Math.max(25, batteryTemp - 0.5); // Cool down
              } else {
                  vibration = rand(20, 50); // Violent braking vibration
                  batteryTemp += 0.2;
              }
          } else {
              // PHASE 1: Initial Emergency -> Slow Down
              speed = Math.max(0, speed * 0.9 - 2); 
              vibration = rand(10, 20);
          }
      } else {
          // NORMAL SIMULATION
          const isMoving = Math.random() > 0.2;
          speed = isMoving ? rand(40, 120) : 0;
          
          const chaos = Math.random() < 0.05;
          batteryTemp += rand(-0.5, 0.5);
          if (isMoving) batteryTemp += 0.1;
          if (chaos) batteryTemp = rand(50, 90); 
          batteryTemp = Math.max(20, Math.min(100, batteryTemp));

          vibration = isMoving ? rand(10, 30) : 2;
          if (chaos && Math.random() > 0.5) vibration = rand(60, 95); 
      }

      let brakeWear = v.telemetry.brakeWear;
      if (speed > 0) brakeWear += 0.001;

      let status: Vehicle['status'] = 'OPTIMAL';
      
      // If halted by SOS, mark as CRITICAL but stabilized
      if (this.emergencyMode && isTargetVehicle && this.sosTriggered) {
          status = 'CRITICAL';
      } else {
          if (brakeWear > 90) status = 'MAINTENANCE';
          else if (batteryTemp > 60 || vibration > 50) status = 'CRITICAL';
          else if (batteryTemp > 45 || vibration > 40) status = 'WARNING';
      }

      return {
        ...v,
        status,
        telemetry: {
          speed: parseFloat(speed.toFixed(1)),
          batteryTemp: parseFloat(batteryTemp.toFixed(1)),
          vibration: parseFloat(vibration.toFixed(1)),
          brakeWear: parseFloat(brakeWear.toFixed(2)),
          timestamp: now.toISOString()
        }
      };
    });

    // 3. Master Agent Logic
    if (!this.emergencyMode) { 
        const criticalVehicles = this.vehicles.filter(v => v.status === 'CRITICAL');
        criticalVehicles.forEach(v => {
            const recentLog = this.logs.find(l => l.targetVehicleId === v.id && new Date(l.timestamp).getTime() > now.getTime() - 5000);
            if (!recentLog) {
                newLogs.push({
                    id: crypto.randomUUID(),
                    timestamp: now.toISOString(),
                    agent: 'MASTER',
                    type: 'ALERT',
                    targetVehicleId: v.id,
                    message: `Anomaly detected on ${v.id}. Delegating to Diagnosis Agent.`
                });
            }
        });
    }

    // 4. UEBA Security Logic
    if (Math.random() < 0.02) { 
      const event: SecurityEvent = {
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        severity: Math.random() > 0.7 ? 'HIGH' : 'MEDIUM',
        source: 'Scheduling Agent',
        description: 'Attempted access to /raw_telemetry/encryption_keys',
        action: 'BLOCKED'
      };
      this.securityEvents.unshift(event);
      newLogs.push({
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        agent: 'SECURITY',
        type: 'ALERT',
        message: `UEBA ALERT: ${event.description}. Action: ${event.action}`
      });
    }

    this.logs = [...newLogs, ...this.logs].slice(0, 50); 
    
    if (this.chatQueue.length > 0) {
        newChat = this.chatQueue.shift() || null;
    }

    return {
      vehicles: this.vehicles,
      logs: this.logs,
      events: this.securityEvents,
      chat: newChat,
      driver: this.driverStatus,
      emergency: this.emergencyMode
    };
  }

  triggerEmergencyProtocol() {
    this.emergencyStartTimestamp = Date.now();
    this.addLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agent: 'SAFETY',
        type: 'CRITICAL',
        message: 'GUARDIAN AGENT: Biometric thresholds breached. Driver unresponsive.'
      });
      
      setTimeout(() => {
        this.addLog({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            agent: 'MASTER',
            type: 'CRITICAL',
            message: 'TAKING CONTROL. Initiating emergency braking protocol. Rerouting to safe stop.'
        });
        this.chatQueue.push("CRITICAL ALERT: Driver fatigue/inactivity detected. Autonomous pullover sequence activated.");
      }, 500);
  }

  triggerSOSProtocol() {
      const facilities = [
          "Tesla Service Center (3.2km)",
          "City General Hospital ER (5.1km)",
          "State Police Station #9 (1.8km)",
          "EV Guardian Outpost (0.5km)"
      ];
      const selected = facilities[Math.floor(Math.random() * facilities.length)];
      
      this.addLog({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          agent: 'SAFETY',
          type: 'CRITICAL',
          message: `SOS PROTOCOL: Prolonged inactivity detected. Auto-contacting ${selected}.`
      });

      // Display the specific messages requested
      if (this.emergencyContacts.length > 0) {
          const names = this.emergencyContacts.map(c => c.name).join(', ');
          this.addLog({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            agent: 'SAFETY',
            type: 'ACTION',
            message: `SOS EXTENSION: Notifying contacts: ${names}`
        });
        
        // Pushing separate chat messages for clarity
        this.chatQueue.push(`contacting emergency contacts: ${names}`);
        this.chatQueue.push(`SOS ACTIVATED: Vehicle halted. Emergency teams dispatched to ${selected}.`);
      } else {
        this.chatQueue.push(`contacting emergency contacts (None configured)`);
        this.chatQueue.push(`SOS ACTIVATED: Vehicle halted. Emergency teams dispatched to ${selected}.`);
      }
  }

  addLog(log: AgentLog) {
    this.logs = [log, ...this.logs].slice(0, 50);
  }
}

export const agentSystem = new AgentSystem();