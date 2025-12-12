import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Vehicle } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatWidgetProps {
  selectedVehicle: Vehicle | null;
  incomingMessage?: string | null;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ selectedVehicle, incomingMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your EV Guard. I can assist you with system performance metrics, explain vehicle telemetry, or help you understand the safety protocols currently active.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini Chat
  useEffect(() => {
    const initChat = async () => {
      // Verify API Key availability from environment variables
      // This ensures no hardcoded keys are present in the source
      const apiKey = process.env.API_KEY;
      
      if (!apiKey) {
        console.warn("EV Guard: API_KEY not found in environment. AI features limited.");
        return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: `You are the EV Guard, an expert AI assistant for the AIMS Vehicle Safety & Predictive Maintenance system.

            System Overview:
            1. Master Agent: Orchestrates the workflow. Detects anomalies in live telemetry.
            2. Diagnosis Agent: Analyzes root causes (e.g., Thermal Runaway, Brake Wear).
            3. Scheduling Agent: Books maintenance slots automatically.
            4. Security Agent (UEBA): Monitors internal agent behavior to prevent unauthorized access.
            5. Safety Agent (Guardian): Monitors driver biometrics for fatigue.

            Current Context:
            You have access to the currently selected vehicle's data.

            Guidelines:
            - Explain the "Agentic" concept simply.
            - If asked about the vehicle, use the provided context.
            - Keep answers concise and dashboard-focused.
            `
          }
        });
        setChatSession(chat);
      } catch (error) {
        console.error("Failed to initialize AI chat", error);
      }
    };
    initChat();
  }, []);

  // Handle incoming system alerts
  useEffect(() => {
    if (incomingMessage) {
        setMessages(prev => [...prev, { role: 'model', text: `⚠️ SYSTEM ALERT: ${incomingMessage}` }]);
        if (!isOpen) setIsOpen(true); // Auto open on alert
    }
  }, [incomingMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        // Optional: Auto-submit on voice end
        // handleSubmit(new Event('submit') as any, transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert("Voice input is not supported in this browser.");
    }
  };

  const handleSubmit = async (e: React.FormEvent, overrideText?: string) => {
    e.preventDefault();
    const textToSend = overrideText || input;
    
    if (!textToSend.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend.trim() }]);
    
    // Graceful fallback if chat is not initialized (e.g. no key)
    if (!chatSession) {
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'model', text: "AI connection unavailable. Please check system configuration (API Key)." }]);
        }, 500);
        return;
    }

    setIsLoading(true);

    try {
      // Inject context if available
      let contextMessage = textToSend;
      if (selectedVehicle) {
         contextMessage = `[Vehicle Context - ID: ${selectedVehicle.id}, Speed: ${selectedVehicle.telemetry.speed}km/h, Temp: ${selectedVehicle.telemetry.batteryTemp}°C]\n\nUser Question: ${textToSend}`;
      }

      const result = await chatSession.sendMessageStream({ message: contextMessage });
      
      let fullResponse = "";
      setMessages(prev => [...prev, { role: 'model', text: '' }]); // Placeholder

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          setMessages(prev => {
            const newArr = [...prev];
            newArr[newArr.length - 1] = { role: 'model', text: fullResponse };
            return newArr;
          });
        }
      }
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the network." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border border-cyan-500/30 ${
          isOpen ? 'bg-slate-800 text-slate-300 rotate-90' : 'bg-cyan-600 text-white shadow-cyan-500/30'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )}
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-24 right-6 z-40 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right backdrop-blur-xl ${
        isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`} style={{ height: '500px', maxHeight: '80vh' }}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-950/80 rounded-t-2xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
          <h3 className="text-white font-semibold font-mono">EV Guard</h3>
          <span className="text-xs text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded ml-auto border border-cyan-900/50">AI</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-cyan-700 text-white rounded-br-none shadow-lg shadow-cyan-900/20' 
                  : msg.text.includes('SYSTEM ALERT') 
                    ? 'bg-red-900/40 text-red-200 border border-red-500/30 rounded-bl-none'
                    : 'bg-slate-800 text-slate-300 rounded-bl-none border border-slate-700'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700 bg-slate-950/50 rounded-b-2xl">
          <div className="relative flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask EV Guard..."}
              disabled={isLoading || isListening}
              className={`flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl py-3 pl-4 pr-10 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 text-xs font-mono transition-all ${
                isListening ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''
              }`}
            />
            
            {/* Voice Button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isLoading || isListening}
              className={`absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                isListening 
                  ? 'text-red-500 animate-pulse bg-red-900/20' 
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
              }`}
              title="Voice Input"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>

            {/* Send Button */}
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading || isListening}
              className="p-3 bg-cyan-700 text-white rounded-xl hover:bg-cyan-600 disabled:opacity-50 disabled:hover:bg-cyan-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatWidget;