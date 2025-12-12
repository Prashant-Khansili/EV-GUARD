export interface Vehicle {
  id: string;
  model: string;
  owner: string;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE';
  telemetry: {
    speed: number;       // km/h
    batteryTemp: number; // Celsius
    vibration: number;   // Hz
    brakeWear: number;   // %
    timestamp: string;
  };
}

export interface DriverStatus {
  attention: number;    // 0-100%
  eyeClosure: number;   // 0.0 - 1.0 (1.0 is closed)
  headMovement: number; // 0.0 - 10.0 (magnitude of movement)
  emotion: 'FOCUSED' | 'DISTRACTED' | 'DROWSY';
  bpm: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  agent: 'MASTER' | 'DIAGNOSIS' | 'SCHEDULING' | 'SECURITY' | 'RCA' | 'SAFETY';
  message: string;
  type: 'INFO' | 'ACTION' | 'ALERT' | 'SUCCESS' | 'CRITICAL';
  targetVehicleId?: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  source: string;
  action: 'BLOCKED' | 'FLAGGED' | 'ALLOWED';
}

export interface Insight {
  id: string;
  component: string;
  issue: string;
  confidence: number;
  recommendation: string;
}

export type RiskLevel = 'SAFE' | 'WARNING' | 'HIGH RISK';

export interface SensorData {
  timestamp: string;
  voltage: number;
  current: number;
  temperature: number;
  soc: number;
}

export interface HealthStatus {
  health_score: number;
  risk_level: RiskLevel;
  reason: string;
  recommended_action: string;
}