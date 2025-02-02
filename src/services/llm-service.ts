import { LLMType, LLMResponse, LLMConfig } from '../types/llm';
import { characterLLMConfig, defaultLLMConfig, getBackupLLM, getCharacterLLM } from '../config/llm-config';
import { LLM_MODULES } from '../config/llm-mapping';
import { speak } from '../services/voice-service';
import { AI_RESPONSE_MODE } from '../config/app-config'; // 确保导入配置
import { AI_IDENTITY_FILTERS, CHARACTER_BASED_REPLACEMENTS } from '../config/ai-filter-config';
import { useLanguage } from '../contexts/LanguageContext';
import i18n from '../config/i18n-config';

async function callLLMAPI(type: LLMType, prompt: string, apiKey: string, modelName: string): Promise<LLMResponse> {
  const maxRetries = 3;
  let retries = 0;
  let currentType = type;
  let currentApiKey = apiKey;
  let currentModelName = modelName;

  while (retries < maxRetries) {
    try {
      let response: string;
      
      switch (currentType) {
        case 'zhipu':
          response = await callZhipuAPI(prompt, currentApiKey, currentModelName);
          break;
        case 'moonshot':
          response = await callMoonshotAPI(prompt, currentApiKey, currentModelName);
          break;
        case 'gemini':
          response = await callGeminiAPI(prompt, currentApiKey, currentModelName);
          break;
        case 'grok':
          response = await callGrokAPI(prompt, currentApiKey, currentModelName);
          break;
        default:
          throw new Error(`不支持的 LLM 类型: ${currentType}`);
      }

      if (!response) {
        throw new Error('API 返回了空响应');
      }

      return { text: response };
    } catch (error) {
      console.error(`Error with ${currentType} API:`, error);
      
      // 尝试获取备用 LLM
      const backupLLM = getBackupLLM(currentType);
      if (backupLLM && retries < maxRetries - 1) {
        console.log(`Switching to backup LLM: ${backupLLM.type}`);
        currentType = backupLLM.type;
        currentApiKey = backupLLM.apiKey;
        currentModelName = backupLLM.modelName || DEFAULT_MODEL_NAMES[backupLLM.type];
        retries++;
        continue;
      }

      if (retries === maxRetries - 1) {
        throw error;
      }
      
      retries++;
      const waitTime = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
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
  try {
    // 检查 API Key 是否存在
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Detailed Gemini API error:', errorData);
      
      // 如果是认证错误，抛出特定的错误
      if (response.status === 401) {
        throw new Error('GEMINI_AUTH_ERROR');
      }
      
      throw new Error(`API Error: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error('Error in callGeminiAPI:', error);
    // 向上传递错误，保持错误处理链
    throw error;
  }
}

async function callGrokAPI(prompt: string, apiKey: string, modelName: string): Promise<string> {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: modelName,
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Detailed Grok API error:', errorData);
      
      if (response.status === 401) {
        throw new Error('GROK_AUTH_ERROR');
      }
      
      throw new Error(`API Error: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('Error in callGrokAPI:', error);
    throw error;
  }
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

async function updateCharacterStats(characterId: string) {
  try {
    const stats = JSON.parse(localStorage.getItem('characterStats') || '{}');
    stats[characterId] = (stats[characterId] || 0) + 1;
    localStorage.setItem('characterStats', JSON.stringify(stats));
    return stats;
  } catch (error) {
    console.error('Error updating character stats:', error);
    return {};
  }
}

function filterAIResponse(text: string, characterId: string): string {
  console.log('过滤前:', text);
  
  // 应用过滤规则
  let filteredText = text;
  
  // 应用AI身份过滤规则
  AI_IDENTITY_FILTERS.forEach(rule => {
    if (rule.pattern.test(filteredText)) {
      console.log('匹配到规则:', rule.pattern);
      console.log('替换前文本:', filteredText);
      filteredText = filteredText.replace(rule.pattern, rule.replacement || '');
      console.log('替换后文本:', filteredText);
    }
  });
  
  // 应用基于角色的替换
  if (CHARACTER_BASED_REPLACEMENTS) {
    Object.entries(CHARACTER_BASED_REPLACEMENTS).forEach(([phrase, replacements]) => {
      const pattern = new RegExp(phrase, 'g');
      filteredText = filteredText.replace(pattern, () => {
        return replacements[Math.floor(Math.random() * replacements.length)];
      });
    });
  }
  
  return filteredText;
}

// 添加思考状态管理
let thinkingStatus = new Map<string, boolean>();

export function setThinkingStatus(characterId: string, status: boolean) {
  thinkingStatus.set(characterId, status);
}

export function getThinkingStatus(characterId: string): boolean {
  return thinkingStatus.get(characterId) || false;
}

export async function getThinkingMessage(characterId: string, language: string): Promise<string> {
  try {
    console.log('=== Thinking Message Debug ===', { characterId, language });
    
    // 使用传入的语言参数，如果没有则从上下文获取
    const currentLanguage = language || i18n.language;
    
    const character = await getCharacterPrompt(characterId);
    const name = character.prompt.match(/Name:\s*(\S+)/)?.[1] || characterId;
    
    // 使用正确的语言参数和翻译键
    const message = i18n.t('chat.thinkingMessage', { 
      name,
      lng: currentLanguage,
      ns: 'translation'
    });
    
    console.log('Generated thinking message:', {
      characterId,
      name,
      language: currentLanguage,
      message
    });
    
    return message;
  } catch (error) {
    console.error('Error in getThinkingMessage:', error);
    // 错误情况下也要确保使用正确的语言
    return i18n.t('chat.thinking', { 
      lng: currentLanguage
    });
  }
}

export async function getLLMResponse(characterId: string, userInput: string): Promise<LLMResponse> {
  try {
    let config = await getCharacterLLM(characterId);
    
    // 保持原有的配置检查逻辑
    if (!config || !config.apiKey) {
      console.warn('Missing LLM configuration or API key, switching to backup');
      const backupConfig = await getBackupLLM();
      if (!backupConfig || !backupConfig.apiKey) {
        throw new Error('No valid LLM configuration available');
      }
      config = backupConfig;
    }

    // 获取角色提示和语音设置
    const { prompt: characterPrompt, voice } = await getCharacterPrompt(characterId);
    
    // 构建完整提示
    const fullPrompt = `${characterPrompt}\n\n用户: ${userInput}\n\n你:`;
    
    try {
      // 首先尝试使用配置的 LLM
      const response = await callLLMAPI(config.type, fullPrompt, config.apiKey, config.modelName);
      
      if (!response || !response.text) {
        throw new Error('Empty response from API');
      }

      // 处理响应文本（保持原有的处理逻辑）
      const processedResponse = await processLLMResponse(response.text, characterPrompt, voice);
      return { text: processedResponse };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // 如果是 Gemini 认证错误，直接切换到备用 LLM
      if (errorMessage === 'GEMINI_AUTH_ERROR' || errorMessage.includes('401')) {
        console.log('Authentication error with Gemini, switching to backup LLM');
        const backupConfig = await getBackupLLM();
        if (backupConfig && backupConfig.apiKey) {
          return callLLMAPI(backupConfig.type, fullPrompt, backupConfig.apiKey, backupConfig.modelName);
        }
      }
      
      throw error; // 重新抛出错误，让外层错误处理来处理
    }

  } catch (error) {
    console.error('Error in getLLMResponse:', error);
    return {
      text: i18n.t('chat.errorMessage'),
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    setThinkingStatus(characterId, false);
  }
}

// 保持其他辅助函数不变
async function processLLMResponse(text: string, prompt: string, voice: string) {
  console.log('过滤前的回复:', text);
  const filteredText = filterAIResponse(text, '');
  console.log('过滤后的回复:', filteredText);
  return filteredText;
}
