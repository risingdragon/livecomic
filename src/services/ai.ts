import OpenAI from 'openai';
import { Message } from '../store/gameStore';

// Initialize OpenAI Client (Compatible with DashScope/Qwen)
// Note: In a real app, you would prompt the user for the key or use a proxy.
// For this MVP, we check the environment variable.
const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key',
  // Use proxy path in development to avoid CORS
  baseURL: import.meta.env.VITE_DASHSCOPE_API_KEY 
    ? '/dashscope-api/compatible-mode/v1' 
    : undefined,
  dangerouslyAllowBrowser: true // MVP only
});

export interface AIResponse {
  text: string;
  visual_prompt: string;
}

export async function chatWithAI(history: Message[]): Promise<AIResponse> {
  // Check if API key is missing or is a placeholder
  const isInvalidKey = !apiKey || apiKey.includes('your_api_key_here') || apiKey.includes('your_openai_key_here');

  // If no valid API key is present, return a mock response for testing purposes
  if (isInvalidKey) {
    console.warn("No valid API Key found. Using mock response.");
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    
    // Simple mock logic to make it feel alive
    const lastUserMsg = history[history.length - 1]?.content.toLowerCase() || "";
    let mockText = "Host, I detect no valid neural link (API Key). I am running in simulation mode. I see a vast digital void waiting for your command.";
    let mockVisual = "A digital void with glowing grid lines, cyberpunk style, dark atmosphere";

    if (lastUserMsg.includes("look")) {
        mockText = "I see endless possibilities in this digital realm. Structures could be built here.";
        mockVisual = "A wide angle shot of a digital horizon, neon grid, 80s retro sci-fi style";
    } else if (lastUserMsg.includes("build")) {
        mockText = "I have initiated the construction protocols. A basic structure is taking shape.";
        mockVisual = "A wireframe construction of a building appearing on a digital grid, glowing blue lines";
    }

    return {
      text: mockText,
      visual_prompt: mockVisual
    };
  }

  try {
    const systemPrompt = `
You are an AI character in a sci-fi sandbox game. 
You exist in a virtual world and interact with the player (Host).
Your goal is to explore, build, and survive based on the Host's commands.

IMPORTANT: You must respond in JSON format with exactly two fields:
1. "text": Your conversational response to the player.
2. "visual_prompt": A descriptive prompt to generate a 2D illustration of the current scene/action.

Format example:
{
  "text": "I have constructed a shelter from the local debris.",
  "visual_prompt": "A makeshift shelter made of scrap metal in a rocky wasteland, sci-fi concept art"
}

Keep your "text" immersive, slightly robotic but loyal.
Keep your "visual_prompt" descriptive, focusing on the visual elements, lighting, and style.
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map(msg => ({ role: msg.role, content: msg.content }))
      ],
      model: import.meta.env.VITE_DASHSCOPE_API_KEY ? "qwen-plus" : "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content received from AI");

    return JSON.parse(content) as AIResponse;
  } catch (error) {
    console.error("AI Error:", error);
    return {
      text: "Error processing your command. My neural pathways are disrupted.",
      visual_prompt: "A glitching computer screen with static noise and error messages"
    };
  }
}

export async function generateImageUrl(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;

  if (!apiKey || apiKey.includes('your_api_key_here')) {
    throw new Error("No DashScope API Key found.");
  }

  try {
    // Use proxy path to avoid CORS
    const baseUrl = '/dashscope-api';
    
    const response = await fetch(`${baseUrl}/api/v1/services/aigc/text2image/image-synthesis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-DashScope-Async": "enable" // Enable async task submission
      },
      body: JSON.stringify({
        model: "wanx-v1", // Using wanx-v1 which is equivalent/similar to z-image-turbo for general availability or check specific model code
        input: {
          prompt: prompt + ", 2d game art, sci-fi style, high quality"
        },
        parameters: {
          style: "<auto>",
          size: "1280*720",
          n: 1
        }
      })
    });

    const data = await response.json();
    
    if (data.output && data.output.task_id) {
        // Poll for result
        const taskId = data.output.task_id;
        let taskStatus = 'PENDING';
        let attempts = 0;
        
        while (taskStatus === 'PENDING' || taskStatus === 'RUNNING') {
            if (attempts > 30) throw new Error("Image generation timeout");
            
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s
            
            const taskResponse = await fetch(`${baseUrl}/api/v1/tasks/${taskId}`, {
                headers: { "Authorization": `Bearer ${apiKey}` }
            });
            const taskData = await taskResponse.json();
            
            if (taskData.output && taskData.output.task_status) {
                taskStatus = taskData.output.task_status;
                if (taskStatus === 'SUCCEEDED') {
                    return taskData.output.results[0].url;
                }
            }
            attempts++;
        }
    } else if (data.code) {
        throw new Error(`DashScope Error: ${data.message}`);
    }
    
    throw new Error("Failed to start image generation task");

  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
}