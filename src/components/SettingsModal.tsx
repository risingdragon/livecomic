import React, { useState, useEffect } from 'react';
import { X, Key, Save } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { apiKey, setApiKey, addLog } = useGameStore();
  const [inputKey, setInputKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputKey(apiKey || '');
    }
  }, [isOpen, apiKey]);

  const handleSave = () => {
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
      addLog('success', 'API Key updated successfully');
      onClose();
    }
  };

  const handleClear = () => {
    setApiKey(''); // Clears the key
    setInputKey('');
    addLog('warning', 'API Key removed');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-green-900/50 p-6 rounded-lg w-[400px] shadow-2xl shadow-green-900/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-mono text-green-500 flex items-center gap-2">
            <Key size={20} />
            ACCESS_CONFIGURATION
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
              Aliyun DashScope API Key
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-green-500 transition-colors"
            />
            <p className="text-[10px] text-gray-600 mt-2">
              Your key is stored locally in your browser and is never sent to our servers.
            </p>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              disabled={!inputKey.trim()}
              className="flex-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-900/50 py-2 rounded font-mono text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              SAVE_CREDENTIALS
            </button>
            
            {apiKey && (
                <button
                onClick={handleClear}
                className="px-4 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded font-mono text-sm transition-all"
                >
                CLEAR
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}