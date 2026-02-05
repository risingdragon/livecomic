import React, { useEffect } from 'react';
import { Terminal } from './components/Terminal';
import { ImageDisplay } from './components/ImageDisplay';
import { useGameStore } from './store/gameStore';
import { chatWithAI, generateImageUrl } from './services/ai';

function App() {
  const { 
    history, 
    logs,
    addMessage, 
    addLog,
    currentImageUrl, 
    setImage, 
    isProcessing, 
    setProcessing 
  } = useGameStore();

  // Initial welcome message if history is empty
  useEffect(() => {
    if (history.length === 0) {
      addLog('info', 'System initialized');
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
      const response = await chatWithAI(newHistory);
      
      addLog('success', 'AI response received', { 
        text_preview: response.text.substring(0, 50) + '...',
        visual_prompt: response.visual_prompt 
      });

      // 3. Update State with AI response
      addMessage({ role: 'assistant', content: response.text });
      
      // 4. Generate Image
      addLog('info', 'Generating image...', { prompt: response.visual_prompt });
      
      try {
        const imageUrl = await generateImageUrl(response.visual_prompt);
        
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
        <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-xs text-green-500 backdrop-blur-sm border border-green-900/50">
          <div>VISUAL_FEED_ACTIVE</div>
          <div className="opacity-70">CAM_01 // REMOTE_LINK</div>
        </div>
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
    </div>
  );
}

export default App;