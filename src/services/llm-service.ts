import { LLMType, LLMResponse, LLMConfig } from '../types/llm';
import { characterLLMConfig, defaultLLMConfig, getBackupLLM, getCharacterLLM } from '../config/llm-config';
import { LLM_MODULES } from '../config/llm-mapping';
import { speak } from '../services/voice-service';
import { AI_RESPONSE_MODE } from '../config/app-config'; // 确保导入配置
import { AI_IDENTITY_FILTERS, CHARACTER_BASED_REPLACEMENTS } from '../config/ai-filter-config';

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
    console.log('Calling Gemini API with prompt length:', prompt.length);
    
    // 检查 API 密钥，不再硬编码默认值
    if (!apiKey) {
      throw new Error('API key is not configured');
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent', {
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
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Detailed Gemini API error:', error);
    throw error;
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
  responseText = responseText.replace(/Gemini|Google|谷歌|kimi|DeepSeek|DeepSeek Coder/g, '');

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
  let filteredText = text;
  
  // 应用AI身份过滤规则
  AI_IDENTITY_FILTERS.forEach(rule => {
    if (typeof rule.pattern === 'string') {
      filteredText = filteredText.replace(new RegExp(rule.pattern, 'g'), 
        rule.replacement || '');
    } else {
      filteredText = filteredText.replace(rule.pattern, 
        typeof rule.replacement === 'function' ? rule.replacement() : 
        (rule.replacement || ''));
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

export async function getLLMResponse(characterId: string, prompt: string): Promise<LLMResponse> {
  try {
    console.log('=== Start getLLMResponse ===');
    console.log('Character ID:', characterId);
    console.log('User prompt:', prompt);

    // 更新角色统计
    await updateCharacterStats(characterId);
    
    // 获取随机 LLM 配置
    const config: LLMConfig = getCharacterLLM(characterId);
    console.log('LLM Config:', {
      type: config.type,
      modelName: config.modelName,
      hasApiKey: !!config.apiKey
    });
    
    // 获取角色提示和语音设置
    const { prompt: characterPrompt, voice } = await getCharacterPrompt(characterId);
    console.log('Character prompt loaded:', {
      promptLength: characterPrompt.length,
      voice: voice
    });

    // 构建完整提示
    const fullPrompt = `${characterPrompt}\n\n用户: ${prompt}\n\n你:`;
    console.log('Calling LLM API with type:', config.type);
    
    // 确保 config.type 和 config.apiKey 存在
    if (!config.type || !config.apiKey) {
      console.error('Configuration error:', {
        hasType: !!config.type,
        hasApiKey: !!config.apiKey
      });
      throw new Error('Invalid LLM configuration');
    }

    // 调用 LLM API
    console.log('Calling LLM API with type:', config.type);
    let response = await callLLMAPI(
      config.type,
      fullPrompt,
      config.apiKey,
      config.modelName || 'gpt-3.5-turbo'  // 提供默认模型
    );
    
    if (!response || !response.text) {
      throw new Error('Empty response from API');
    }

    // 处理角色名称
    const nameMatch = characterPrompt.match(/Name:\s*(\S+)/);
    if (nameMatch) {
      const correctName = nameMatch[1];
      console.log('Character name found:', correctName);
      const wrongNamePattern = /(?:我叫|我是|你可以叫我)\s*([^，。！？,!?]+)/g;
      response.text = response.text.replace(wrongNamePattern, (match, wrongName) => {
        if (wrongName !== correctName) {
          console.log('Replacing wrong name:', wrongName, 'with:', correctName);
          return match.replace(wrongName, correctName);
        }
        return match;
      });
      response.text = filterAIResponse(response.text, characterId);
    }

    // 处理语音播放
    if (response.text && (AI_RESPONSE_MODE === 'text_and_voice' || AI_RESPONSE_MODE === 'voice')) {
      console.log('Playing voice with mode:', AI_RESPONSE_MODE);
      await speak(response.text, voice);
    }

    console.log('=== End getLLMResponse ===');
    return response;

  } catch (error) {
    console.error('=== Error in getLLMResponse ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    let errorMessage = '对不起，我现在遇到了一些技术问题。';
    if (error instanceof Error) {
      if (error.message.includes('Invalid LLM configuration')) {
        errorMessage = '系统配置出现问题，请联系管理员。';
      } else if (error.message.includes('Network Error')) {
        errorMessage = '网络连接出现问题，请检查您的网络连接。';
      } else if (error.message.includes('API key')) {
        errorMessage = 'API密钥无效，请联系管理员。';
      } else if (error.message.includes('Empty response')) {
        errorMessage = 'AI 响应为空，请重试。';
      }
    }
    
    return { 
      text: errorMessage,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
