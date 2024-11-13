import { LLMType, LLMResponse, LLMConfig } from '../types/llm';
import { characterLLMConfig, defaultLLMConfig } from '../config/llm-config';
import { LLM_MODULES } from '../config/llm-mapping';
import { speak } from '../services/voice-service';
import { AI_RESPONSE_MODE } from '../config/app-config'; // 确保导入配置

async function callLLMAPI(type: LLMType, prompt: string, apiKey: string, modelName: string): Promise<LLMResponse> {
  if (!apiKey) {
    throw new Error(`${type} API 密钥未设置`);
  }
  if (!modelName) {
    throw new Error(`${type} 模型名称未设置`);
  }

  const moduleName = LLM_MODULES[type];
  console.log(`Calling ${type} API with model: ${modelName} using module: ${moduleName}`);
  
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      let response: string;

      switch (type) {
        case 'zhipu':
          response = await callZhipuAPI(prompt, apiKey, modelName);
          break;
        case 'moonshot':
          response = await callMoonshotAPI(prompt, apiKey, modelName);
          break;
        case 'gemini':
          response = await callGeminiAPI(prompt, apiKey, modelName);
          break;
        default:
          throw new Error(`不支持的 LLM 类型: ${type}`);
      }

      if (!response) {
        throw new Error('API 返回了空响应');
      }

      return { text: response };
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error details for ${type} API:`, error);
        if (error.message.includes('429')) {
          retries++;
          const waitTime = Math.pow(2, retries) * 1000; // 指数退避
          console.log(`Rate limited. Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (error.message.includes('Unexpected API response format') || error.message.includes('API response is not a valid JSON object')) {
          console.error(`API 响应格式错误:`, error);
          throw error; // 直接抛出这类错误，不再重试
        } else if (retries === maxRetries - 1) {
          console.error(`调用 ${type} API 时出错:`, error);
          throw error;
        } else {
          retries++;
          const waitTime = Math.pow(2, retries) * 1000;
          console.log(`Error occurred. Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } else {
        console.error(`未知错误:`, error);
        throw new Error('发生未知错误');
      }
    }
  }

  throw new Error(`达到最大重试次数 (${maxRetries})`);
}

async function callZhipuAPI(prompt: string, apiKey: string, modelName: string): Promise<string> {
  try {
    const url = 'https://open.bigmodel.cn/api/paas/v3/model-api/chatglm_turbo/sse-invoke';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': apiKey
    };
    const body = JSON.stringify({
      prompt: [{"role": "user", "content": prompt}],
      temperature: 0.95,
      top_p: 0.7,
      incremental: false
    });

    console.log('Calling Zhipu API with body:', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!response.ok) {
      console.error('Zhipu API error:', response.status, await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Zhipu API response:', data);

    return data.data.choices[0].content;
  } catch (error) {
    console.error('Error in callZhipuAPI:', error);
    throw error;
  }
}

async function callMoonshotAPI(prompt: string, apiKey: string, modelName: string): Promise<string> {
  const url = 'https://api.moonshot.cn/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  const body = JSON.stringify({
    model: modelName,
    messages: [{"role": "user", "content": prompt}]
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: body
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGeminiAPI(prompt: string, apiKey: string, modelName: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const headers = {
    'Content-Type': 'application/json'
  };
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: body
  });

  if (response.status === 429) {
    throw new Error('HTTP error! status: 429');
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data || typeof data !== 'object') {
    throw new Error('API response is not a valid JSON object');
  }

  if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
    throw new Error('API response does not contain any candidates');
  }

  const candidate = data.candidates[0];
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('Invalid candidate structure');
  }

  if (!candidate.content || typeof candidate.content !== 'object') {
    throw new Error('Candidate does not contain valid content');
  }

  if (!candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
    throw new Error('Candidate content does not contain any parts');
  }

  const part = candidate.content.parts[0];
  if (!part || typeof part !== 'object' || !part.text || typeof part.text !== 'string') {
    throw new Error('Candidate content part does not contain valid text');
  }

  let responseText = part.text;

  // 过滤掉可能暴露 AI 身份的内容
  responseText = responseText.replace(/我是.*?AI|我是.*?语言模型|我是.*?助手|我没有名字/g, '');
  responseText = responseText.replace(/Gemini|Google|谷歌/g, '');

  return responseText;
}

async function getCharacterPrompt(characterId: string): Promise<{ prompt: string; voice: string }> {
  try {
    const response = await fetch(`/prompts/${characterId}.txt`);
    const promptContent = await response.text();

    // 解析角色配置，提取语音风格
    const lines = promptContent.split('\n');
    const voiceLine = lines.find(line => line.startsWith('Voice:'));
    const voice = voiceLine ? voiceLine.split(':')[1].trim() : 'defaultVoice'; // 默认语音

    return { prompt: promptContent, voice };
  } catch (error) {
    console.error(`Error loading prompt for character ${characterId}:`, error);
    throw new Error(`无法加载角色 ${characterId} 的提示`);
  }
}

export async function getLLMResponse(characterId: string, prompt: string): Promise<LLMResponse> {
  const config: LLMConfig = characterLLMConfig[characterId] || defaultLLMConfig;

  try {
    console.log(`Loading character prompt for ${characterId}`);
    const { prompt: characterPrompt, voice } = await getCharacterPrompt(characterId);
    console.log(`Character prompt loaded successfully`);

    const fullPrompt = `${characterPrompt}\n\n用户: ${prompt}\n\n你:`;
    console.log(`Calling LLM API for ${characterId} with config:`, config);
    let response = await callLLMAPI(config.type, fullPrompt, config.apiKey, config.modelName || '');
    console.log(`LLM API response received:`, response);

    // 从角色提示中提取正确的名字
    const nameMatch = characterPrompt.match(/Name:\s*(\S+)/);
    if (nameMatch) {
      const correctName = nameMatch[1];
      const wrongNamePattern = /(?:我叫|我是|你可以叫我)\s*([^，。！？,!?]+)/g;
      response.text = response.text.replace(wrongNamePattern, (match, wrongName) => {
        if (wrongName !== correctName) {
          return match.replace(wrongName, correctName);
        }
        return match;
      });
    }

    // 根据配置决定是否播放语音
    if (AI_RESPONSE_MODE === 'text_and_voice' || AI_RESPONSE_MODE === 'voice') {
      speak(response.text, voice); // 播放语音
    }

    return response; // 返回响应
  } catch (error) {
    console.error(`Error in getLLMResponse for ${characterId}:`, error);
    return { text: `对不起，我现在遇到了一些问题。让我们稍后再聊吧。`, error: error instanceof Error ? error.message : String(error) };
  }
}
