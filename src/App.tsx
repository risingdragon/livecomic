import React, { useEffect, useState } from 'react';
import { Terminal } from './components/Terminal';
import { ImageDisplay } from './components/ImageDisplay';
import { SettingsModal } from './components/SettingsModal';
import { useGameStore } from './store/gameStore';
import { chatWithAI, generateImageUrl } from './services/ai';
import { ChevronUp, ChevronDown } from 'lucide-react';

function App() {
  const {
    history,
    logs,
    addMessage,
    addLog,
    currentImageUrl,
    setImage,
    isProcessing,
    setProcessing,
    apiKey,
    customAPIConfig,
    useCustomAPI
  } = useGameStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);

  // Initial welcome message if history is empty
  useEffect(() => {
    if (history.length === 0) {
      addLog('info', 'System initialized');
    }

    // Auto-open settings if no API Key found (both in env and local storage)
    const hasEnvKey = import.meta.env.VITE_DASHSCOPE_API_KEY || import.meta.env.VITE_GROK_API_KEY;
    const hasCustomConfig = customAPIConfig?.chat?.baseUrl && customAPIConfig?.chat?.apiKey;
    if (!hasEnvKey && !apiKey && !hasCustomConfig) {
      setIsSettingsOpen(true);
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    // 1. Add user message
    addMessage({ role: 'user', content });
    addLog('info', 'User input received', { content });
    setProcessing(true);

    try {
      // 2. Call AI
      addLog('info', 'Sending request to AI...');
      const newHistory = [...history, { role: 'user' as const, content }];

      // Use custom API config if enabled, otherwise use preset
      const response = useCustomAPI
        ? await chatWithAI(newHistory, undefined, customAPIConfig)
        : await chatWithAI(newHistory, apiKey);

      addLog('success', 'AI response received', {
        text_preview: (response.text || "").substring(0, 50) + '...',
        visual_prompt: response.visual_prompt
      });

      // 3. Update State with AI response
      addMessage({
        role: 'assistant',
        content: response.text,
        choices: response.choices
      });

      // 4. Generate Image
      addLog('info', 'Generating image...', { prompt: response.visual_prompt });

      try {
        const imageUrl = useCustomAPI
          ? await generateImageUrl(response.visual_prompt, undefined, customAPIConfig)
          : await generateImageUrl(response.visual_prompt, apiKey);

        addLog('info', 'Image generation result', {
          url: imageUrl,
          source: useCustomAPI ? 'custom' : 'preset'
        });

        setImage(imageUrl, response.visual_prompt);
      } catch (imgError) {
        const errorMsg = String(imgError);
        console.error('Image generation failed:', imgError);

        // 检查是否是 API 不支持图像生成
        if (errorMsg.includes('could not generate an image') ||
            errorMsg.includes('not supported') ||
            errorMsg.includes('image generation') ||
            errorMsg.includes('bad_response_body')) {
          addLog('warning', '当前 API 不支持图像生成，继续文字游戏', { error: errorMsg });
          // 使用一个占位图片或保持当前图片
          addMessage({
            role: 'system',
            content: '[系统：当前 API 不支持图像生成，继续纯文字冒险]'
          });
        } else {
          addLog('error', 'Image generation failed', { error: errorMsg });
        }
      }

    } catch (error) {
      console.error("Game Loop Error:", error);
      addLog('error', 'Game loop error', { error: String(error) });
      addMessage({
        role: 'system',
        content: "CRITICAL ERROR: Connection lost. Retrying..."
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-game-bg overflow-hidden text-white font-mono">
      {/* Background: Full screen Image Display */}
      <div className="absolute inset-0">
        <ImageDisplay 
          imageUrl={currentImageUrl} 
          isLoading={isProcessing} 
        />
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden md:flex h-full w-full">
        {/* Left: 70% Image Display */}
        <div className="w-[70%] h-full relative border-r border-gray-700">
        </div>

        {/* Right: 30% Terminal */}
        <div className="w-[30%] h-full min-w-[300px] bg-black/80 backdrop-blur-sm">
          <Terminal 
            history={history} 
            logs={logs}
            onSendMessage={handleSendMessage} 
            isProcessing={isProcessing}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
      </div>

      {/* Mobile: Overlay Terminal Panel */}
      <div 
        className={`md:hidden fixed bottom-0 left-0 right-0 z-20 transition-transform duration-300 ease-in-out ${
          isTerminalVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '35vh' }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsTerminalVisible(!isTerminalVisible)}
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-1 rounded-t-lg border border-gray-700 border-b-0 text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          aria-label={isTerminalVisible ? '隐藏终端' : '显示终端'}
        >
          {isTerminalVisible ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          <span className="text-xs">{isTerminalVisible ? '隐藏' : '显示'}</span>
        </button>

        {/* Terminal Panel */}
        <div className="h-full bg-black/70 backdrop-blur-sm border-t border-gray-700">
          <Terminal 
            history={history} 
            logs={logs}
            onSendMessage={handleSendMessage} 
            isProcessing={isProcessing}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
      </div>

      {/* Mobile: Floating toggle button when terminal is hidden */}
      {!isTerminalVisible && (
        <button
          onClick={() => setIsTerminalVisible(true)}
          className="md:hidden fixed bottom-4 right-4 z-30 bg-black/70 backdrop-blur-sm p-3 rounded-full border border-gray-700 text-gray-400 hover:text-white transition-colors"
          aria-label="显示终端"
        >
          <ChevronUp size={20} />
        </button>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

export default App;