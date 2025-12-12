import React, { useEffect, useRef, useState } from 'react';
import { DriverStatus } from '../types';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

interface DriverCamProps {
  status: DriverStatus;
  onToggleSim: () => void;
  onRealtimeUpdate?: (status: DriverStatus) => void;
}

const DriverCam: React.FC<DriverCamProps> = ({ status, onToggleSim, onRealtimeUpdate }) => {
  const isDrowsy = status.emotion === 'DROWSY';
  const isDistracted = status.emotion === 'DISTRACTED';
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastProcessRef = useRef<number>(0);
  const prevNoseRef = useRef<{x: number, y: number} | null>(null);

  // Eye Indices for MediaPipe Face Mesh
  // Left Eye: [33, 160, 158, 133, 153, 144]
  // Right Eye: [362, 385, 387, 263, 373, 380]
  // EAR Denominator points: Left(33, 133), Right(362, 263)
  // EAR Numerator pairs: Left(160-144, 158-153), Right(385-380, 387-373)

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, frameRate: 30 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(false);
        
        // Initialize AI after camera starts
        initAI();
      } catch (err) {
        console.error("Failed to access camera:", err);
        setCameraError(true);
      }
    };

    const initAI = async () => {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
            );
            
            const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1
            });
            
            faceLandmarkerRef.current = faceLandmarker;
            setAiLoaded(true);
            setIsAiProcessing(true);
            processVideo();
        } catch (error) {
            console.error("AI Init Failed:", error);
            // Fallback to manual simulation mode silently
        }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const processVideo = () => {
      const now = Date.now();
      if (videoRef.current && faceLandmarkerRef.current && videoRef.current.readyState >= 2) {
          if (now - lastProcessRef.current >= 100) { // Limit to 10 FPS for performance
             lastProcessRef.current = now;
             
             const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, now);
             
             if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                 const landmarks = results.faceLandmarks[0];
                 
                 // --- 1. Eye Closure (EAR) ---
                 const getDist = (i1: number, i2: number) => {
                     const p1 = landmarks[i1];
                     const p2 = landmarks[i2];
                     return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                 };

                 const leftEyeV = getDist(159, 145);
                 const leftEyeH = getDist(33, 133);
                 const rightEyeV = getDist(386, 374);
                 const rightEyeH = getDist(362, 263);

                 const leftEAR = leftEyeV / leftEyeH;
                 const rightEAR = rightEyeV / rightEyeH;
                 
                 const avgEAR = (leftEAR + rightEAR) / 2;
                 
                 let closure = 0;
                 if (avgEAR > 0.22) closure = 0;
                 else if (avgEAR < 0.12) closure = 1.0;
                 else {
                     closure = (0.22 - avgEAR) / 0.1;
                 }
                 
                 const attention = Math.max(0, 100 - (closure * 100));
                 
                 let emotion: DriverStatus['emotion'] = 'FOCUSED';
                 if (closure > 0.8) emotion = 'DROWSY';
                 else if (closure > 0.5) emotion = 'DISTRACTED';

                 // --- 2. Head Movement (Nose Tracking) ---
                 // Landmark 1 is the nose tip
                 const nose = landmarks[1];
                 let headMove = 0;
                 
                 if (prevNoseRef.current) {
                     const dx = nose.x - prevNoseRef.current.x;
                     const dy = nose.y - prevNoseRef.current.y;
                     // Euclidean distance. Normal range for movement is small (0.01-0.05).
                     // Multiply by 1000 to get a readable score (0-50+).
                     headMove = Math.sqrt(dx*dx + dy*dy) * 1000;
                 }
                 prevNoseRef.current = nose;
                 
                 if (onRealtimeUpdate) {
                     onRealtimeUpdate({
                         attention: Math.round(attention),
                         eyeClosure: closure,
                         headMovement: headMove,
                         emotion: emotion,
                         bpm: 75 // Mocked
                     });
                 }
             }
          }
      }
      requestRef.current = requestAnimationFrame(processVideo);
  };

  return (
    <div className={`relative bg-slate-900 border rounded-xl overflow-hidden flex flex-col transition-all duration-500 h-full min-h-[240px] ${
        isDrowsy ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 
        isDistracted ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' :
        cameraError ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'border-slate-800'
    }`}>
      
      {/* Header */}
      <div className={`p-3 border-b flex justify-between items-center ${
          isDrowsy ? 'bg-red-900/40 border-red-500/50' : 
          isDistracted ? 'bg-amber-900/40 border-amber-500/50' :
          cameraError ? 'bg-amber-900/40 border-amber-500/50' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
                isDrowsy ? 'bg-red-500 animate-ping' : 
                isDistracted ? 'bg-amber-500 animate-pulse' :
                cameraError ? 'bg-amber-500' : 
                aiLoaded ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'
            }`}></div>
            <h3 className={`text-xs font-bold font-mono uppercase ${
                isDrowsy ? 'text-red-400' : 
                isDistracted ? 'text-amber-400' :
                cameraError ? 'text-amber-400' : 
                aiLoaded ? 'text-cyan-400' : 'text-slate-400'
            }`}>
                Guardian Cam
            </h3>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            isDrowsy ? 'bg-red-500 text-white border-red-400 animate-pulse' : 
            isDistracted ? 'bg-amber-500 text-black border-amber-400' :
            cameraError ? 'bg-amber-500 text-black border-amber-400' : 
            aiLoaded ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-slate-800 text-slate-500 border-slate-700'
        }`}>
            {isDrowsy ? 'DANGER DETECTED' : 
             isDistracted ? 'LOW ATTENTION' : 
             cameraError ? 'SENSOR BLOCKED' : 
             aiLoaded ? 'AI VISION ACTIVE' : 'INITIALIZING AI...'}
        </span>
      </div>

      {/* Main Visual */}
      <div className="relative flex-1 bg-black group overflow-hidden">
         {/* Webcam Feed */}
         {!cameraError ? (
            <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transform scale-x-[-1] transition-all duration-700 ${
                    isDrowsy ? 'blur-sm grayscale sepia contrast-125' : 
                    isDistracted ? 'grayscale-[50%] contrast-110' : 'opacity-90'
                }`}
            />
         ) : (
            // Camera Blocked Warning
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h4 className="text-amber-500 font-bold uppercase tracking-wider text-sm mb-2">Camera Access Denied</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                    Driver monitoring is inactive. Please enable camera permissions in your browser settings to activate the Guardian Agent.
                </p>
            </div>
         )}
         
         {/* Red Overlay for Drowsy State */}
         <div className={`absolute inset-0 bg-red-900/40 mix-blend-overlay transition-opacity duration-500 pointer-events-none ${isDrowsy ? 'opacity-100' : 'opacity-0'}`}></div>
         
         {/* HUD Overlay (Only if camera works) */}
         {!cameraError && (
            <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                {/* Face Tracking Box Simulation */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 rounded-lg transition-all duration-300 ${
                    isDrowsy ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] scale-110' : 
                    isDistracted ? 'border-amber-500/60 scale-105' : 
                    aiLoaded ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-slate-500/30 opacity-50'
                }`}>
                    {/* Crosshairs */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0.5 h-2 bg-current"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-0.5 h-2 bg-current"></div>
                    <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-2 h-0.5 bg-current"></div>
                    <div className="absolute right-0 top-1/2 translate-x-2 -translate-y-1/2 w-2 h-0.5 bg-current"></div>
                    
                    {aiLoaded && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 font-mono whitespace-nowrap bg-black/50 px-1 rounded">
                            TRACKING ACTIVE
                        </div>
                    )}
                </div>

                {/* Metrics Top */}
                <div className="flex justify-between items-start font-mono text-xs">
                    <div className="bg-black/60 backdrop-blur px-2 py-1 rounded text-cyan-400 border border-cyan-900/50">
                        ID: LIVE
                    </div>
                    {/* Inactivity Monitor Indicator */}
                     {status.headMovement < 0.3 && (
                        <div className="bg-amber-900/80 backdrop-blur px-2 py-1 rounded text-amber-500 border border-amber-900/50 flex items-center gap-1 animate-pulse">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            INACTIVITY
                        </div>
                    )}
                </div>

                {/* Metrics Bottom */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-300 bg-black/50 p-1 rounded">
                        <span>ATTENTION</span>
                        <span className={status.attention < 40 ? 'text-red-500' : status.attention < 75 ? 'text-amber-500' : 'text-cyan-400'}>{status.attention.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-300 ${status.attention < 40 ? 'bg-red-500' : status.attention < 75 ? 'bg-amber-500' : 'bg-cyan-500'}`} 
                            style={{ width: `${status.attention}%` }}
                        />
                    </div>
                    
                    {/* Movement Bar */}
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 bg-black/50 p-1 rounded mt-1">
                        <span>MOVEMENT</span>
                        <span className={status.headMovement < 0.3 ? 'text-amber-500' : 'text-slate-400'}>{status.headMovement.toFixed(2)}</span>
                    </div>
                </div>
            </div>
         )}
         
         {/* Simulation Trigger Button (Fallback) */}
         {!aiLoaded && !cameraError && (
             <button 
                onClick={onToggleSim}
                className={`absolute bottom-2 right-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-all duration-300 pointer-events-auto opacity-0 group-hover:opacity-100 bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-600`}
             >
                MANUAL TEST
             </button>
         )}
      </div>
    </div>
  );
};

export default DriverCam;