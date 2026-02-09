import React, { useEffect, useState } from 'react';
import { Terminal } from './components/Terminal';
import { ImageDisplay } from './components/ImageDisplay';
import { SettingsModal } from './components/SettingsModal';
import { useGameStore } from './store/gameStore';
import { chatWithAI, generateImageUrl } from './services/ai';
import { Settings } from 'lucide-react';

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
    apiKey
  } = useGameStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initial welcome message if history is empty
  useEffect(() => {
    if (history.length === 0) {
      addLog('info', 'System initialized');
    }
    
    // Auto-open settings if no API Key found (both in env and local storage)
    const hasEnvKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
    if (!hasEnvKey && !apiKey) {
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
      const response = await chatWithAI(newHistory, apiKey);
      
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
        const imageUrl = await generateImageUrl(response.visual_prompt, apiKey);
        
        addLog('info', 'Image generation result', { 
          url: imageUrl,
          source: 'dashscope'
        });
        
        setImage(imageUrl, response.visual_prompt);
      } catch (imgError) {
        addLog('error', 'Image generation failed', { error: String(imgError) });
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
    <div className="flex h-screen w-screen bg-game-bg overflow-hidden text-white font-mono">
      {/* Left: 70% Image Display */}
      <div className="w-[70%] h-full relative border-r border-gray-700">
        <ImageDisplay 
          imageUrl={currentImageUrl} 
          isLoading={isProcessing} 
        />
        
        {/* Optional: Overlay info */}
        {/* Removed as per user request */}

        {/* Settings Button */}
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 right-4 bg-black/50 p-2 rounded text-gray-400 hover:text-white backdrop-blur-sm border border-gray-800 hover:border-gray-500 transition-all z-10"
          title="Configure API Key"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Right: 30% Terminal */}
      <div className="w-[30%] h-full min-w-[300px]">
        <Terminal 
          history={history} 
          logs={logs}
          onSendMessage={handleSendMessage} 
          isProcessing={isProcessing} 
        />
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

export default App;