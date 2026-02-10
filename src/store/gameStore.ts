import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  choices?: string[];
}

export interface LogEntry {
  timestamp: number;
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  details?: any;
}

export interface CustomAPIConfig {
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  imageModel?: string;
}

interface GameState {
  history: Message[];
  logs: LogEntry[];
  currentImageUrl?: string;
  currentVisualPrompt?: string;
  isProcessing: boolean;
  apiKey?: string;
  customAPIConfig?: CustomAPIConfig;
  useCustomAPI: boolean;

  addMessage: (message: Message) => void;
  addLog: (type: LogEntry['type'], message: string, details?: any) => void;
  setImage: (url: string, prompt: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  setApiKey: (key: string) => void;
  setCustomAPIConfig: (config: CustomAPIConfig) => void;
  setUseCustomAPI: (use: boolean) => void;
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
      apiKey: undefined,
      customAPIConfig: undefined,
      useCustomAPI: false,

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

      setApiKey: (key) => set({ apiKey: key }),

      setCustomAPIConfig: (config) => set({ customAPIConfig: config }),

      setUseCustomAPI: (use) => set({ useCustomAPI: use }),

      resetGame: () => set((state) => ({
        history: [],
        logs: [],
        currentImageUrl: undefined,
        currentVisualPrompt: undefined,
        isProcessing: false,
        apiKey: state.apiKey, // Keep API key on reset
        customAPIConfig: state.customAPIConfig, // Keep custom config on reset
        useCustomAPI: state.useCustomAPI
      })),
    }),
    {
      name: 'h5-sandbox-storage',
      partialize: (state) => ({
        history: state.history,
        logs: state.logs,
        currentImageUrl: state.currentImageUrl,
        currentVisualPrompt: state.currentVisualPrompt,
        apiKey: state.apiKey,
        customAPIConfig: state.customAPIConfig,
        useCustomAPI: state.useCustomAPI
      }), // Don't persist isProcessing
    }
  )
);