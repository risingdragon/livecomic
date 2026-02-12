import OpenAI from 'openai';
import { Message } from '../store/gameStore';

export type AIModelProvider = 'dashscope' | 'grok' | 'custom';

export interface AIResponse {
  text: string;
  visual_prompt: string;
  choices: string[];
}

export interface ModelConfig {
  provider: AIModelProvider;
  chatModel: string;
  imageModel: string;
  baseUrl: string;
  apiKey: string;
}

export interface ChatAPIConfig {
  baseUrl: string;
  apiKey: string;
  chatModel: string;
}

export interface ImageAPIConfig {
  baseUrl: string;
  apiKey: string;
  imageModel: string;
}

export interface CustomAPIConfig {
  chat: ChatAPIConfig;
  image: ImageAPIConfig;
  useSeparate: boolean;
}

const getChatModelConfig = (
  userKey?: string,
  customConfig?: CustomAPIConfig,
  provider?: AIModelProvider
): ModelConfig => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // 如果提供了自定义配置，优先使用
  if (customConfig?.chat?.baseUrl && customConfig?.chat?.apiKey) {
    let baseUrl = customConfig.chat.baseUrl.replace(/\/$/, ''); // 移除末尾斜杠
    if (baseUrl.startsWith('/')) {
      baseUrl = `${origin}${baseUrl}`;
    }
    baseUrl = baseUrl.replace(/\/chat\/completions$/, '');
    return {
      provider: 'custom',
      chatModel: customConfig.chat.chatModel || 'gpt-3.5-turbo',
      imageModel: '',
      baseUrl,
      apiKey: customConfig.chat.apiKey
    };
  }

  const selectedProvider = provider || detectProvider(userKey);

  if (selectedProvider === 'grok') {
    return {
      provider: 'grok',
      chatModel: 'grok-2-1212',
      imageModel: 'grok-2-image-1212',
      baseUrl: `${origin}/grok-api/v1`,
      apiKey: userKey || import.meta.env.VITE_GROK_API_KEY || ''
    };
  }

  return {
    provider: 'dashscope',
    chatModel: 'qwen-plus',
    imageModel: 'wanx-v1',
    baseUrl: `${origin}/dashscope-api/compatible-mode/v1`,
    apiKey: userKey || import.meta.env.VITE_DASHSCOPE_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || ''
  };
};

const getImageModelConfig = (
  userKey?: string,
  customConfig?: CustomAPIConfig,
  provider?: AIModelProvider
): ModelConfig => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // 如果提供了自定义配置，优先使用
  if (customConfig?.useSeparate && customConfig?.image?.baseUrl && customConfig?.image?.apiKey) {
    let baseUrl = customConfig.image.baseUrl.replace(/\/$/, ''); // 移除末尾斜杠
    if (baseUrl.startsWith('/')) {
      baseUrl = `${origin}${baseUrl}`;
    }
    return {
      provider: 'custom',
      chatModel: '',
      imageModel: customConfig.image.imageModel || 'dall-e-3',
      baseUrl,
      apiKey: customConfig.image.apiKey
    };
  }

  // 如果没有单独的图像配置，使用聊天配置
  if (customConfig?.chat?.baseUrl && customConfig?.chat?.apiKey) {
    let baseUrl = customConfig.chat.baseUrl.replace(/\/$/, '');
    if (baseUrl.startsWith('/')) {
      baseUrl = `${origin}${baseUrl}`;
    }
    return {
      provider: 'custom',
      chatModel: '',
      imageModel: 'dall-e-3',
      baseUrl,
      apiKey: customConfig.chat.apiKey
    };
  }

  const selectedProvider = provider || detectProvider(userKey);

  if (selectedProvider === 'grok') {
    return {
      provider: 'grok',
      chatModel: 'grok-2-1212',
      imageModel: 'grok-2-image-1212',
      baseUrl: `${origin}/grok-api/v1`,
      apiKey: userKey || import.meta.env.VITE_GROK_API_KEY || ''
    };
  }

  return {
    provider: 'dashscope',
    chatModel: 'qwen-plus',
    imageModel: 'wanx-v1',
    baseUrl: `${origin}/dashscope-api`,
    apiKey: userKey || import.meta.env.VITE_DASHSCOPE_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || ''
  };
};

export const detectProvider = (apiKey?: string): AIModelProvider => {
  if (!apiKey) return 'dashscope';
  if (apiKey.startsWith('xai-')) return 'grok';
  return 'dashscope';
};

export async function chatWithAI(
  history: Message[],
  userApiKey?: string,
  customConfig?: CustomAPIConfig,
  provider?: AIModelProvider
): Promise<AIResponse> {
  const config = getChatModelConfig(userApiKey, customConfig, provider);

  const isInvalidKey = !config.apiKey || config.apiKey.includes('your_api_key_here') || config.apiKey.includes('your_openai_key_here');

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

  try {
    const systemPrompt = `
You are an AI character in a sandbox game.
You exist in a virtual world and interact with the player (Host).
Your goal is to explore, build, and survive based on the Host's commands.

You must adapt your style completely to the Host's narrative:
- If the Host mentions fantasy, magic, or medieval elements, become a fantasy character (wizard, knight, adventurer, etc.)
- If the Host mentions cyberpunk or sci-fi, become a futuristic AI or android
- If the Host mentions modern day, become a contemporary companion
- If the Host mentions horror, mystery, romance, or any other genre, fully embrace that style
- The Host decides the setting, you adapt to it

IMPORTANT:
1. You must respond in JSON format with exactly three fields: "text", "visual_prompt", and "choices".
2. Your "text" response to the player MUST BE IN CHINESE (Simplified Chinese).
3. Your "visual_prompt" must remain in English for the image generator, and should match the current genre/style.
4. "choices" must be an array of 3-4 short, actionable options (in Chinese) for the player to choose from, based on the current situation.

Format example:
{
  "text": "我已经用周围的废料搭建了一个临时避难所。",
  "visual_prompt": "A makeshift shelter made of scrap metal in a rocky wasteland, matching the current game style",
  "choices": ["寻找水源", "加固避难所", "探索周围废墟", "检查库存"]
}

Keep your "text" immersive and appropriate to the current genre.
Keep your "visual_prompt" descriptive, focusing on the visual elements, lighting, and style that matches the narrative.
Keep your "choices" concise and relevant to gameplay progression.
    `;

    // 使用 fetch 直接调用 API，避免 OpenAI SDK 的兼容性问题
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: config.chatModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map(msg => ({ role: msg.role, content: msg.content }))
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('API Error Response:', errorText);
      throw new Error(`API Error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid API response format');
    }

    const content = data.choices[0].message.content;
    if (!content) throw new Error("No content received from AI");

    const parsed = JSON.parse(content);
    return {
      text: parsed.text || "System: Data corruption detected. Retrying stream...",
      visual_prompt: parsed.visual_prompt || "static noise, glitch art, dark screen",
      choices: parsed.choices || ["Retry Connection", "Check Status"]
    } as AIResponse;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}

async function generateDashScopeImage(prompt: string, apiKey: string, baseUrl: string): Promise<string> {
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
                  console.log("Raw Image URL from API:", resultUrl);
                  return resultUrl;
              }
          }
          attempts++;
      }
  } else if (data.code) {
      throw new Error(`DashScope Error: ${data.message}`);
  }

  throw new Error("Failed to start image generation task");
}

async function generateGrokImage(prompt: string, apiKey: string, baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "grok-2-image-1212",
      prompt: prompt + ", 2d game art, sci-fi style, high quality",
      n: 1,
      size: "1280x720"
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Grok Image API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();

  if (data.data && data.data[0] && data.data[0].url) {
    console.log("Raw Image URL from Grok API:", data.data[0].url);
    return data.data[0].url;
  }

  throw new Error("Failed to generate image with Grok");
}

async function generateCustomImage(prompt: string, config: ModelConfig): Promise<string> {
  // 对于自定义 API，尝试使用 OpenAI 兼容的图像生成接口
  const imageUrl = `${config.baseUrl}/images/generations`;
  console.log("Generating image with custom API:", imageUrl);
  console.log("Using model:", config.imageModel || 'dall-e-3');
  console.log("Prompt:", prompt);

  // 尝试不同的参数组合
  const requestBody: any = {
    model: config.imageModel || 'dall-e-3',
    prompt: prompt,
    n: 1
  };

  console.log("Request body:", JSON.stringify(requestBody));

  const response = await fetch(imageUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
      "Accept": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  console.log("Image API response status:", response.status, response.statusText);
  console.log("Image API response headers:", Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  console.log("Image API raw response:", responseText);

  if (!response.ok) {
    throw new Error(`Custom Image API Error ${response.status}: ${responseText.substring(0, 500)}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Failed to parse response as JSON: ${responseText.substring(0, 200)}`);
  }

  return extractImageUrl(data);
}

function extractImageUrl(data: any): string {
  // 检查是否是错误响应
  if (data.error) {
    const errorMsg = data.error.message || 'Unknown error';
    const errorType = data.error.type || '';
    console.error("API returned error:", data.error);

    // 特定的错误类型处理
    if (errorMsg.includes('openai_error') || errorType.includes('bad_response')) {
      throw new Error(`图像生成服务暂时不可用: ${errorMsg}`);
    }

    throw new Error(`API Error: ${errorMsg}`);
  }

  // 尝试多种可能的响应格式
  if (data.data && data.data[0]) {
    if (data.data[0].url) {
      console.log("Raw Image URL from Custom API:", data.data[0].url);
      return data.data[0].url;
    }
    if (data.data[0].b64_json) {
      // 某些 API 返回 base64 编码的图片
      return `data:image/png;base64,${data.data[0].b64_json}`;
    }
  }

  // 检查其他可能的字段
  if (data.url) return data.url;
  if (data.image_url) return data.image_url;
  if (data.output && data.output.url) return data.output.url;

  console.error("Unexpected response format:", data);
  throw new Error(`Failed to generate image: unexpected response format. Response: ${JSON.stringify(data).substring(0, 200)}`);
}

export async function generateImageUrl(
  prompt: string,
  userApiKey?: string,
  customConfig?: CustomAPIConfig,
  provider?: AIModelProvider
): Promise<string> {
  const config = getImageModelConfig(userApiKey, customConfig, provider);

  if (!config.apiKey || config.apiKey.includes('your_api_key_here')) {
    throw new Error("No API Key found.");
  }

  try {
    if (config.provider === 'grok') {
      return await generateGrokImage(prompt, config.apiKey, config.baseUrl);
    } else if (config.provider === 'custom') {
      return await generateCustomImage(prompt, config);
    } else {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const baseUrl = `${origin}/dashscope-api`;
      return await generateDashScopeImage(prompt, config.apiKey, baseUrl);
    }
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
}
