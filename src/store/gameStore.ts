import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LogEntry {
  timestamp: number;
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  details?: any;
}

interface GameState {
  history: Message[];
  logs: LogEntry[];
  currentImageUrl?: string;
  currentVisualPrompt?: string;
  isProcessing: boolean;
  
  addMessage: (message: Message) => void;
  addLog: (type: LogEntry['type'], message: string, details?: any) => void;
  setImage: (url: string, prompt: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      history: [],
      logs: [],
      currentImageUrl: undefined,
      currentVisualPrompt: undefined,
      isProcessing: false,

      addMessage: (message) => set((state) => ({ 
        history: [...state.history, message] 
      })),

      addLog: (type, message, details) => set((state) => ({
        logs: [...state.logs, { timestamp: Date.now(), type, message, details }]
      })),

      setImage: (url, prompt) => set({ 
        currentImageUrl: url, 
        currentVisualPrompt: prompt 
      }),

      setProcessing: (isProcessing) => set({ isProcessing }),

      resetGame: () => set({ 
        history: [], 
        logs: [],
        currentImageUrl: undefined, 
        currentVisualPrompt: undefined, 
        isProcessing: false 
      }),
    }),
    {
      name: 'h5-sandbox-storage',
      partialize: (state) => ({ 
        history: state.history, 
        logs: state.logs,
        currentImageUrl: state.currentImageUrl,
        currentVisualPrompt: state.currentVisualPrompt
      }), // Don't persist isProcessing
    }
  )
);