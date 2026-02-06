import OpenAI from 'openai';
import { Message } from '../store/gameStore';

export interface AIResponse {
  text: string;
  visual_prompt: string;
}

const getApiKey = (userKey?: string) => {
  return userKey || import.meta.env.VITE_DASHSCOPE_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
};

const getBaseUrl = (apiKey?: string) => {
    // If using local env key, use proxy to avoid CORS in dev
    if (!apiKey && import.meta.env.VITE_DASHSCOPE_API_KEY) {
        return '/dashscope-api/compatible-mode/v1';
    }
    // For BYOK in production (Vercel), we also need to use the proxy path
    // because browser direct calls to DashScope will fail CORS.
    // Our vercel.json rewrites /dashscope-api/* to https://dashscope.aliyuncs.com/*
    return '/dashscope-api/compatible-mode/v1';
};

export async function chatWithAI(history: Message[], userApiKey?: string): Promise<AIResponse> {
  const apiKey = getApiKey(userApiKey);
  
  // Check if API key is missing or is a placeholder
  const isInvalidKey = !apiKey || apiKey.includes('your_api_key_here') || apiKey.includes('your_openai_key_here');

  // If no valid API key is present, return a mock response
  if (isInvalidKey) {
    console.warn("No valid API Key found. Using mock response.");
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    const lastUserMsg = history[history.length - 1]?.content.toLowerCase() || "";
    let mockText = "Host, I detect no valid neural link (API Key). Please configure your access key in settings.";
    let mockVisual = "A digital void with glowing grid lines, cyberpunk style, dark atmosphere";

    if (lastUserMsg.includes("look")) {
        mockText = "I see endless possibilities, but my sensors are offline. (Please set API Key)";
    }

    return {
      text: mockText,
      visual_prompt: mockVisual
    };
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: getBaseUrl(userApiKey),
    dangerouslyAllowBrowser: true 
  });

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
      model: "qwen-plus", // Explicitly use qwen-plus for DashScope
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content received from AI");

    return JSON.parse(content) as AIResponse;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}

export async function generateImageUrl(prompt: string, userApiKey?: string): Promise<string> {
  const apiKey = getApiKey(userApiKey);

  if (!apiKey || apiKey.includes('your_api_key_here')) {
    throw new Error("No DashScope API Key found.");
  }

  try {
    // Determine Base URL
    // Always use the proxy path '/dashscope-api' which is handled by:
    // 1. vite.config.ts (in dev) -> proxies to https://dashscope.aliyuncs.com
    // 2. vercel.json (in prod) -> rewrites to https://dashscope.aliyuncs.com
    // This solves CORS issues for both dev and prod (BYOK)
    const baseUrl = '/dashscope-api';
    
    const response = await fetch(`${baseUrl}/api/v1/services/aigc/text2image/image-synthesis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-DashScope-Async": "enable"
      },
      body: JSON.stringify({
        model: "wanx-v1", 
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
        const taskId = data.output.task_id;
        let taskStatus = 'PENDING';
        let attempts = 0;
        
        while (taskStatus === 'PENDING' || taskStatus === 'RUNNING') {
            if (attempts > 30) throw new Error("Image generation timeout");
            
            await new Promise(r => setTimeout(r, 1000));
            
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