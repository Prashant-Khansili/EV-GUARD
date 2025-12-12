import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  sender: 'AGENT' | 'USER';
  text: string;
}

interface ChatInterfaceProps {
  incomingMessage: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ incomingMessage }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', sender: 'AGENT', text: 'Customer Engagement Agent v2.4 initialized. Monitoring fleet status for proactive outreach.' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (incomingMessage) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'AGENT', text: incomingMessage }]);
    }
  }, [incomingMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if(!input.trim()) return;
    
    setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'USER', text: input }]);
    setInput('');

    // Simulated response
    setTimeout(() => {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'AGENT', text: 'Understood. I have updated the maintenance ticket and notified the service center.' }]);
    }, 1000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-1/2 overflow-hidden">
      <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-xs font-bold text-green-400 font-mono uppercase">Customer Link</h3>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/30">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-2.5 rounded-lg text-xs leading-relaxed ${
                m.sender === 'USER' 
                ? 'bg-slate-700 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-300 border border-slate-700 rounded-bl-none'
            }`}>
              {m.sender === 'AGENT' && <div className="text-[10px] text-green-500 font-bold mb-1">AGENT</div>}
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-2 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs text-white p-2 focus:outline-none focus:border-green-500"
            placeholder="Reply to agent..."
        />
        <button type="submit" className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold">SEND</button>
      </form>
    </div>
  );
};

export default ChatInterface;
