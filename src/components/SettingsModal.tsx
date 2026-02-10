import React, { useState, useEffect } from 'react';
import { X, Key, Save, Server, ToggleLeft, ToggleRight } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { detectProvider, AIModelProvider } from '../services/ai';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'preset' | 'custom';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    apiKey,
    setApiKey,
    customAPIConfig,
    setCustomAPIConfig,
    useCustomAPI,
    setUseCustomAPI,
    addLog
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>(useCustomAPI ? 'custom' : 'preset');
  const [inputKey, setInputKey] = useState('');
  const [detectedProvider, setDetectedProvider] = useState<AIModelProvider>('dashscope');

  // Custom API form state
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [customChatModel, setCustomChatModel] = useState('gpt-3.5-turbo');
  const [customImageModel, setCustomImageModel] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputKey(apiKey || '');
      setDetectedProvider(detectProvider(apiKey));
      setActiveTab(useCustomAPI ? 'custom' : 'preset');

      // Load custom config if exists
      if (customAPIConfig) {
        setCustomBaseUrl(customAPIConfig.baseUrl || '');
        setCustomKey(customAPIConfig.apiKey || '');
        setCustomChatModel(customAPIConfig.chatModel || 'gpt-3.5-turbo');
        setCustomImageModel(customAPIConfig.imageModel || '');
      }
    }
  }, [isOpen, apiKey, customAPIConfig, useCustomAPI]);

  const handleInputChange = (value: string) => {
    setInputKey(value);
    setDetectedProvider(detectProvider(value));
  };

  const handleSavePreset = () => {
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
      setUseCustomAPI(false);
      const provider = detectProvider(inputKey.trim());
      addLog('success', `${provider === 'grok' ? 'Grok' : 'DashScope'} API Key updated successfully`);
      onClose();
    }
  };

  const handleSaveCustom = () => {
    if (customBaseUrl.trim() && customKey.trim() && customChatModel.trim()) {
      const config = {
        baseUrl: customBaseUrl.trim(),
        apiKey: customKey.trim(),
        chatModel: customChatModel.trim(),
        imageModel: customImageModel.trim() || undefined
      };
      setCustomAPIConfig(config);
      setUseCustomAPI(true);
      addLog('success', 'Custom API configuration saved successfully');
      onClose();
    }
  };

  const handleClear = () => {
    setApiKey('');
    setInputKey('');
    setDetectedProvider('dashscope');
    setCustomAPIConfig({ baseUrl: '', apiKey: '', chatModel: '' });
    setCustomBaseUrl('');
    setCustomKey('');
    setCustomChatModel('gpt-3.5-turbo');
    setCustomImageModel('');
    setUseCustomAPI(false);
    addLog('warning', 'All API configurations cleared');
  };

  const getPlaceholder = () => {
    if (detectedProvider === 'grok') {
      return 'xai-xxxxxxxxxxxxxxxxxxxxxxxx';
    }
    return 'sk-xxxxxxxxxxxxxxxxxxxxxxxx';
  };

  const getLabel = () => {
    if (detectedProvider === 'grok') {
      return 'xAI Grok API Key';
    }
    return 'Aliyun DashScope API Key';
  };

  const hasAnyConfig = apiKey || (customAPIConfig?.baseUrl && customAPIConfig?.apiKey);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-green-900/50 p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl shadow-green-900/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-mono text-green-500 flex items-center gap-2">
            <Key size={20} />
            ACCESS_CONFIGURATION
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded font-mono text-sm transition-all ${
              activeTab === 'preset'
                ? 'bg-green-900/50 text-green-400 border border-green-900/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Key size={14} />
            预设平台
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded font-mono text-sm transition-all ${
              activeTab === 'custom'
                ? 'bg-blue-900/50 text-blue-400 border border-blue-900/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Server size={14} />
            自定义 API
          </button>
        </div>

        {activeTab === 'preset' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                {getLabel()}
              </label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
              <p className="text-[10px] text-gray-600 mt-2">
                支持 DashScope (sk-xxx) 或 Grok (xai-xxx) API Key。您的密钥仅存储在本地浏览器中。
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSavePreset}
                disabled={!inputKey.trim()}
                className="flex-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-900/50 py-2 rounded font-mono text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                SAVE_CREDENTIALS
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                Base URL
              </label>
              <input
                type="text"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-gray-600 mt-1">
                聚合平台或自定义 API 的基础地址，需要包含版本路径（如 /v1）
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                API Key
              </label>
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="your-api-key"
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                Chat Model
              </label>
              <input
                type="text"
                value={customChatModel}
                onChange={(e) => setCustomChatModel(e.target.value)}
                placeholder="gpt-3.5-turbo"
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-gray-600 mt-1">
                对话模型名称，如 gpt-3.5-turbo、gpt-4 等
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                Image Model (可选)
              </label>
              <input
                type="text"
                value={customImageModel}
                onChange={(e) => setCustomImageModel(e.target.value)}
                placeholder="dall-e-3"
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-gray-600 mt-1">
                图像生成模型名称，留空则使用 dall-e-3
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveCustom}
                disabled={!customBaseUrl.trim() || !customKey.trim() || !customChatModel.trim()}
                className="flex-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 py-2 rounded font-mono text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                SAVE_CUSTOM_API
              </button>
            </div>
          </div>
        )}

        {/* Clear Button */}
        {hasAnyConfig && (
          <div className="mt-6 pt-4 border-t border-gray-800">
            <button
              onClick={handleClear}
              className="w-full px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded font-mono text-sm transition-all"
            >
              CLEAR_ALL_CONFIGURATIONS
            </button>
          </div>
        )}

        {/* Current Status */}
        <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700">
          <div className="text-xs font-mono text-gray-500 mb-1">CURRENT_STATUS</div>
          <div className="flex items-center gap-2">
            {useCustomAPI ? (
              <>
                <Server size={14} className="text-blue-400" />
                <span className="text-sm text-blue-400">自定义 API</span>
                <span className="text-xs text-gray-500">({customAPIConfig?.baseUrl})</span>
              </>
            ) : apiKey ? (
              <>
                <Key size={14} className="text-green-400" />
                <span className="text-sm text-green-400">
                  {detectProvider(apiKey) === 'grok' ? 'Grok' : 'DashScope'}
                </span>
              </>
            ) : (
              <>
                <ToggleLeft size={14} className="text-gray-500" />
                <span className="text-sm text-gray-500">未配置</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
