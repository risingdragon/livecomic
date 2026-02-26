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
    addLog,
    resetGame
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>(useCustomAPI ? 'custom' : 'preset');
  const [inputKey, setInputKey] = useState('');
  const [detectedProvider, setDetectedProvider] = useState<AIModelProvider>('dashscope');

  // Custom API form state
  const [customChatBaseUrl, setCustomChatBaseUrl] = useState('');
  const [customChatApiKey, setCustomChatApiKey] = useState('');
  const [customChatModel, setCustomChatModel] = useState('gpt-3.5-turbo');
  const [customImageBaseUrl, setCustomImageBaseUrl] = useState('');
  const [customImageApiKey, setCustomImageApiKey] = useState('');
  const [customImageModel, setCustomImageModel] = useState('dall-e-3');
  const [useSeparateImage, setUseSeparateImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputKey(apiKey || '');
      setDetectedProvider(detectProvider(apiKey));
      setActiveTab(useCustomAPI ? 'custom' : 'preset');

      // Load custom config if exists
      if (customAPIConfig) {
        setCustomChatBaseUrl(customAPIConfig.chat?.baseUrl || '');
        setCustomChatApiKey(customAPIConfig.chat?.apiKey || '');
        setCustomChatModel(customAPIConfig.chat?.chatModel || 'gpt-3.5-turbo');
        setCustomImageBaseUrl(customAPIConfig.image?.baseUrl || '');
        setCustomImageApiKey(customAPIConfig.image?.apiKey || '');
        setCustomImageModel(customAPIConfig.image?.imageModel || 'dall-e-3');
        setUseSeparateImage(customAPIConfig.useSeparate || false);
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

  // Validate custom API config
  const isCustomConfigValid = () => {
    const isChatValid = customChatBaseUrl.trim() && customChatApiKey.trim() && customChatModel.trim();
    const isImageValid = useSeparateImage ?
      (customImageBaseUrl.trim() && customImageApiKey.trim() && customImageModel.trim()) : true;
    return isChatValid && isImageValid;
  };

  const handleSaveCustom = () => {
    if (isCustomConfigValid()) {
      const config = {
        chat: {
          baseUrl: customChatBaseUrl.trim(),
          apiKey: customChatApiKey.trim(),
          chatModel: customChatModel.trim()
        },
        image: {
          baseUrl: (useSeparateImage ? customImageBaseUrl : customChatBaseUrl).trim(),
          apiKey: (useSeparateImage ? customImageApiKey : customChatApiKey).trim(),
          imageModel: (useSeparateImage ? customImageModel : 'dall-e-3').trim()
        },
        useSeparate: useSeparateImage
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
    setCustomAPIConfig({
      chat: {
        baseUrl: '',
        apiKey: '',
        chatModel: 'gpt-3.5-turbo'
      },
      image: {
        baseUrl: '',
        apiKey: '',
        imageModel: 'dall-e-3'
      },
      useSeparate: false
    });
    setCustomChatBaseUrl('');
    setCustomChatApiKey('');
    setCustomChatModel('gpt-3.5-turbo');
    setCustomImageBaseUrl('');
    setCustomImageApiKey('');
    setCustomImageModel('dall-e-3');
    setUseSeparateImage(false);
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

  const hasAnyConfig = apiKey ||
    (customAPIConfig?.chat?.baseUrl && customAPIConfig?.chat?.apiKey) ||
    (customAPIConfig?.image?.baseUrl && customAPIConfig?.image?.apiKey);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-green-900/50 p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl shadow-green-900/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-mono text-green-500 flex items-center gap-2">
            <Key size={20} />
            配置
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded font-mono text-sm transition-all ${activeTab === 'preset'
              ? 'bg-green-900/50 text-green-400 border border-green-900/50'
              : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <Key size={14} />
            预设平台
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded font-mono text-sm transition-all ${activeTab === 'custom'
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
          <div className="space-y-6">
            {/* Chat API Configuration */}
            <div className="border border-blue-800/30 rounded-lg p-4 bg-blue-900/10">
              <h3 className="text-sm font-mono text-blue-400 mb-4 flex items-center gap-2">
                <Server size={14} />
                CHAT_API_CONFIGURATION
              </h3>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                  Base URL
                </label>
                <input
                  type="text"
                  value={customChatBaseUrl}
                  onChange={(e) => setCustomChatBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  聚合平台或自定义 API 的基础地址，需要包含版本路径（如 /v1）
                </p>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                  API Key
                </label>
                <input
                  type="password"
                  value={customChatApiKey}
                  onChange={(e) => setCustomChatApiKey(e.target.value)}
                  placeholder="your-api-key"
                  className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="mt-3">
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
            </div>

            {/* Image API Configuration */}
            <div className="border border-purple-800/30 rounded-lg p-4 bg-purple-900/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-mono text-purple-400 flex items-center gap-2">
                  <Server size={14} />
                  IMAGE_API_CONFIGURATION
                </h3>
                <label className="flex items-center gap-2 text-xs font-mono text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSeparateImage}
                    onChange={(e) => setUseSeparateImage(e.target.checked)}
                    className="rounded text-purple-500 focus:ring-purple-500"
                  />
                  使用单独的图像 API
                </label>
              </div>

              <div className={useSeparateImage ? '' : 'opacity-50 pointer-events-none'}>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={customImageBaseUrl}
                    onChange={(e) => setCustomImageBaseUrl(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">
                    图像生成 API 的基础地址
                  </p>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={customImageApiKey}
                    onChange={(e) => setCustomImageApiKey(e.target.value)}
                    placeholder="your-image-api-key"
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                    Image Model
                  </label>
                  <input
                    type="text"
                    value={customImageModel}
                    onChange={(e) => setCustomImageModel(e.target.value)}
                    placeholder="dall-e-3"
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">
                    图像生成模型名称，如 dall-e-3、dall-e-2 等
                  </p>
                </div>
              </div>

              {!useSeparateImage && (
                <div className="text-xs text-gray-500 mt-2">
                  未选择单独的图像 API，将使用聊天 API 配置
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveCustom}
                disabled={!isCustomConfigValid()}
                className="flex-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 py-2 rounded font-mono text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                SAVE_CUSTOM_API
              </button>
            </div>
          </div>
        )}

        {/* Game Controls */}
        <div className="mt-6 pt-4 border-t border-gray-800 space-y-2">
          <button
            onClick={() => {
              resetGame();
              addLog('success', 'Game reset successfully');
              onClose();
            }}
            className="w-full px-4 py-2 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400 border border-yellow-900/50 rounded font-mono text-sm transition-all"
          >
            RESTART_GAME
          </button>
          {hasAnyConfig && (
            <button
              onClick={handleClear}
              className="w-full px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded font-mono text-sm transition-all"
            >
              CLEAR_ALL_CONFIGURATIONS
            </button>
          )}
        </div>

        {/* Current Status */}
        <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700">
          <div className="text-xs font-mono text-gray-500 mb-1">CURRENT_STATUS</div>
          <div className="flex flex-col gap-1">
            {useCustomAPI ? (
              <>
                <div className="flex items-center gap-2">
                  <Server size={14} className="text-blue-400" />
                  <span className="text-sm text-blue-400">自定义 API</span>
                </div>
                <div className="ml-6 text-xs text-gray-500">
                  Chat: {customAPIConfig?.chat?.baseUrl}
                </div>
                {customAPIConfig?.useSeparate && (
                  <div className="ml-6 text-xs text-gray-500">
                    Image: {customAPIConfig?.image?.baseUrl}
                  </div>
                )}
              </>
            ) : apiKey ? (
              <>
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-green-400" />
                  <span className="text-sm text-green-400">
                    {detectProvider(apiKey) === 'grok' ? 'Grok' : 'DashScope'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <ToggleLeft size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-500">未配置</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
