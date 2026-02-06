import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { Send, Terminal as TerminalIcon, Activity } from 'lucide-react';
import { LogEntry } from '../store/gameStore';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  choices?: string[];
}

interface TerminalProps {
  history: Message[];
  logs: LogEntry[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

export function Terminal({ history, logs, onSendMessage, isProcessing }: TerminalProps) {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'logs'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, logs, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-black border-l border-gray-700 font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 text-green-500">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded transition-colors",
              activeTab === 'chat' ? "bg-gray-800 text-green-400" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <TerminalIcon size={14} />
            TERMINAL
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded transition-colors",
              activeTab === 'logs' ? "bg-gray-800 text-yellow-400" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <Activity size={14} />
            DEBUG_LOG
          </button>
        </div>
        <div className="flex gap-2 items-center">
           <span className="text-xs opacity-50">{activeTab === 'chat' ? 'ONLINE' : 'MONITORING'}</span>
           <span className={cn(
             "w-2 h-2 rounded-full animate-pulse",
             activeTab === 'chat' ? "bg-green-500" : "bg-yellow-500"
           )}></span>
        </div>
      </div>

      {/* Output Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        {activeTab === 'chat' ? (
          <>
            <div className="text-gray-500 mb-4">
              &gt; System initialized...<br/>
              &gt; Connection established.<br/>
              &gt; Waiting for input...
            </div>

            {history.map((msg, idx) => (
              <div key={idx} className={cn(
                "break-words",
                msg.role === 'user' ? "text-blue-400" : 
                msg.role === 'system' ? "text-yellow-400 italic" : "text-green-400"
              )}>
                <span className="opacity-50 mr-2">
                  {msg.role === 'user' ? '>' : msg.role === 'system' ? '#' : '$'}
                </span>
                {msg.content}
                
                {/* Display choices if available and it's the latest assistant message */}
                {msg.role === 'assistant' && msg.choices && idx === history.length - 1 && !isProcessing && (
                  <div className="mt-2 pl-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.choices.map((choice, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => onSendMessage(choice)}
                        className="text-left text-xs px-3 py-2 border border-green-800 rounded hover:bg-green-900/50 hover:border-green-500 transition-colors text-green-300"
                      >
                        {cIdx + 1}. {choice}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isProcessing && (
              <div className="text-gray-500 animate-pulse">
                &gt; Processing input...
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2 font-mono text-xs">
             {logs.length === 0 && <div className="text-gray-600 italic">No logs recorded yet.</div>}
             {logs.map((log, idx) => (
               <div key={idx} className="border-b border-gray-800 pb-2 mb-2 last:border-0">
                 <div className="flex gap-2 text-gray-500 mb-1">
                   <span>[{formatTime(log.timestamp)}]</span>
                   <span className={cn(
                     "uppercase font-bold",
                     log.type === 'info' ? "text-blue-400" :
                     log.type === 'success' ? "text-green-400" :
                     log.type === 'warning' ? "text-yellow-400" : "text-red-400"
                   )}>{log.type}</span>
                 </div>
                 <div className="text-gray-300 break-words">{log.message}</div>
                 {log.details && (
                   <pre className="mt-1 p-2 bg-gray-900 rounded text-gray-500 overflow-x-auto text-[10px]">
                     {JSON.stringify(log.details, null, 2)}
                   </pre>
                 )}
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Input Area (Only for chat) */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-900 border-t border-gray-800 flex gap-2">
          <span className="text-blue-400 py-2">&gt;</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isProcessing ? "Processing..." : "Enter command..."}
            disabled={isProcessing}
            className="flex-1 bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none py-2"
            autoFocus
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isProcessing}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      )}
      
      {/* Log Controls (Only for logs) */}
      {activeTab === 'logs' && (
        <div className="p-2 bg-gray-900 border-t border-gray-800 flex justify-end">
           <div className="text-xs text-gray-500 px-2">
             Auto-scrolling enabled
           </div>
        </div>
      )}
    </div>
  );
}