import OpenAI from 'openai';
import { Message } from '../store/gameStore';

export interface AIResponse {
  text: string;
  visual_prompt: string;
  choices: string[];
}

const getApiKey = (userKey?: string) => {
  return userKey || import.meta.env.VITE_DASHSCOPE_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
};

const getBaseUrl = (apiKey?: string) => {
    // OpenAI SDK expects a full URL when running in browser environments
    // or it might try to parse relative paths incorrectly.
    // We construct a full URL using the current origin.
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // For BYOK in production (Vercel) and Dev, we use the proxy path
    // because browser direct calls to DashScope will fail CORS.
    return `${origin}/dashscope-api/compatible-mode/v1`;
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
      visual_prompt: mockVisual,
      choices: ["检查设置", "重试连接", "查看状态", "等待信号"]
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
But you must adapt the style to the Host's narrative. 
If the Host mentions fantasy, magic, or medieval elements, adapt your tone and visual descriptions to match that genre (e.g., dark fantasy, high fantasy).
If the Host mentions cyberpunk or sci-fi, stick to the original setting.

IMPORTANT: 
1. You must respond in JSON format with exactly three fields: "text", "visual_prompt", and "choices".
2. Your "text" response to the player MUST BE IN CHINESE (Simplified Chinese).
3. Your "visual_prompt" must remain in English for the image generator.
4. "choices" must be an array of 3-4 short, actionable options (in Chinese) for the player to choose from, based on the current situation.

Format example:
{
  "text": "我已经用周围的废料搭建了一个临时避难所。",
  "visual_prompt": "A makeshift shelter made of scrap metal in a rocky wasteland, sci-fi concept art",
  "choices": ["寻找水源", "加固避难所", "探索周围废墟", "检查库存"]
}

Keep your "text" immersive, slightly robotic but loyal.
Keep your "visual_prompt" descriptive, focusing on the visual elements, lighting, and style.
Keep your "choices" concise and relevant to gameplay progression.
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
    // We use a relative path here because fetch supports it natively
    // But we need to make sure we handle the case where fetch might need a full URL in some edge cases
    // So we use the same origin logic
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const baseUrl = `${origin}/dashscope-api`;
    
    // Check if we are in browser environment and construct full URL if needed (though fetch usually handles relative)
    // But for consistency with getBaseUrl above, we can use the same logic if fetch fails with relative in some contexts
    // However, fetch in browser supports relative URLs perfectly.
    
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
                    const resultUrl = taskData.output.results[0].url;
                    console.log("Raw Image URL from API:", resultUrl); // Debug log
                    return resultUrl;
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