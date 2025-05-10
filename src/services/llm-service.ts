import { LLMType, LLMResponse, LLMConfig } from '../types/llm';
import { getBackupLLM, getCharacterLLM } from '../config/llm-config';
import { LLM_MODULES, DEFAULT_MODEL_NAMES, LLM_TYPES } from '../config/llm-mapping';
import { speak } from '../services/voice-service';
import { AI_RESPONSE_MODE } from '../config/app-config'; // 确保导入配置
import { AI_IDENTITY_FILTERS, CHARACTER_BASED_REPLACEMENTS } from '../config/ai-filter-config';
import { useLanguage } from '../contexts/LanguageContext';
import i18n from '../config/i18n-config';
import logger from '../utils/logger'; // Added logger import

// Helper to get a default model name if not provided
function getModelName(type: LLMType, modelName?: string): string {
  return modelName || DEFAULT_MODEL_NAMES[type];
}

async function callLLMAPI(type: LLMType, prompt: string, apiKey: string, modelNameInput: string): Promise<LLMResponse> {
  const maxRetries = 3;
  let retries = 0;
  let currentType = type;
  let currentApiKey = apiKey;
  let currentModelName = modelNameInput; // Already ensured to be string by callers like getLLMResponse

  while (retries < maxRetries) {
    try {
      let response: string;
      
      switch (currentType) {
        case LLM_TYPES.ZHIPU:
          response = await callZhipuAPI(prompt, currentApiKey, currentModelName);
          break;
        case LLM_TYPES.MOONSHOT:
          response = await callMoonshotAPI(prompt, currentApiKey, currentModelName);
          break;
        case LLM_TYPES.GEMINI:
          response = await callGeminiAPI(prompt, currentApiKey, currentModelName);
          break;
        case LLM_TYPES.GROK: // Added Grok
          response = await callGrokAPI(prompt, currentApiKey, currentModelName);
          break;
        case LLM_TYPES.OPENROUTER: // Added OpenRouter
          response = await callOpenRouterAPI(prompt, currentApiKey, currentModelName);
          break;
        default:
          // Exhaustive check guard
          const _exhaustiveCheck: never = currentType;
          throw new Error(`Unsupported LLM type: ${_exhaustiveCheck}`);
      }

      if (!response) {
        throw new Error('API returned an empty response');
      }

      return { text: response };
    } catch (error) {
      logger.error(`Error with ${currentType} API (model: ${currentModelName}):`, error);
      
      const backupLLM = getBackupLLM(currentType); // Pass currentType
      if (backupLLM && backupLLM.apiKey && retries < maxRetries - 1) {
        logger.log(`Switching to backup LLM: ${backupLLM.type}`);
        currentType = backupLLM.type;
        currentApiKey = backupLLM.apiKey;
        currentModelName = getModelName(backupLLM.type, backupLLM.modelName); // Ensure modelName is string
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

  throw new Error(`Reached maximum retries (${maxRetries})`);
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

    logger.log('Calling Zhipu API with body:', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!response.ok) {
      logger.error('Zhipu API error:', response.status, await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    logger.log('Zhipu API response:', data);

    if (data.data && data.data.choices && data.data.choices[0] && data.data.choices[0].content) {
        return data.data.choices[0].content;
    } else if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
    }
    else if (data.data && data.data.choices && data.data.choices[0] && data.data.choices[0].parts && data.data.choices[0].parts[0] && data.data.choices[0].parts[0].text ) {
       return data.data.choices[0].parts[0].text;
    }
     else if (typeof data === 'string') {
        throw new Error('Unsupported Zhipu API response structure');
    }
    throw new Error('Unsupported Zhipu API response structure');

  } catch (error) {
    logger.error('Error in callZhipuAPI:', error);
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
    const errorText = await response.text();
    logger.error('Moonshot API error:', response.status, errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGeminiAPI(prompt: string, apiKey: string, modelName: string): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }
    const geminiModelForAPI = modelName.includes('vision') ? 'gemini-pro-vision' : 'gemini-pro';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelForAPI}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
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
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      logger.error('Detailed Gemini API error:', errorData);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('GEMINI_AUTH_ERROR');
      }
      
      throw new Error(`API Error: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
     if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      logger.error('Unexpected Gemini API response structure:', data);
      throw new Error('Unexpected Gemini API response structure');
    }

  } catch (error) {
    logger.error('Error in callGeminiAPI:', error);
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
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      logger.error('Detailed Grok API error:', errorData);
      
      if (response.status === 401) {
        throw new Error('GROK_AUTH_ERROR');
      }
      
      throw new Error(`API Error: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    logger.error('Error in callGrokAPI:', error);
    throw error;
  }
}

async function callOpenRouterAPI(promptText: string, apiKey: string, modelIdentifier: string): Promise<string> {
  let modelToUse = modelIdentifier;

  try {
    if (modelIdentifier === 'openrouter/random-free') {
      logger.log('Fetching free models from OpenRouter...');
      const modelsResponse = await fetch('https://openrouter.ai/api/v1/models');
      if (!modelsResponse.ok) {
        throw new Error(`Failed to fetch models from OpenRouter: ${modelsResponse.status}`);
      }
      const modelsData = await modelsResponse.json();
      const freeModels = modelsData.data.filter((model: any) => 
        model.id.endsWith(':free') || 
        (model.pricing && model.pricing.prompt === "0.000000" && model.pricing.completion === "0.000000")
      );

      if (freeModels.length > 0) {
        const randomIndex = Math.floor(Math.random() * freeModels.length);
        modelToUse = freeModels[randomIndex].id;
        logger.log(`Randomly selected free OpenRouter model: ${modelToUse}`);
      } else {
        logger.warn('No free models found on OpenRouter. Falling back to a default or throwing error.');
        modelToUse = 'openai/gpt-3.5-turbo';
        logger.log(`Falling back to default OpenRouter model: ${modelToUse}`);
      }
    }

    const siteUrl = import.meta.env.VITE_OPENROUTER_SITE_URL || window.location.hostname || 'unknown_site';
    const siteName = import.meta.env.VITE_OPENROUTER_SITE_NAME || 'AI Chat App';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': siteName,
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [{ role: 'user', content: promptText }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
       logger.error('Unexpected OpenRouter API response structure:', data);
      throw new Error('Unexpected OpenRouter API response structure');
    }
  } catch (error) {
    logger.error(`Error in callOpenRouterAPI (model: ${modelToUse}):`, error);
    throw error;
  }
}

async function getCharacterPrompt(characterId: string): Promise<{ prompt: string; voice: string }> {
  try {
    const response = await fetch(`/prompts/${characterId}.txt`);
    if (!response.ok) {
        throw new Error(`Failed to fetch prompt for character ${characterId}: ${response.status}`);
    }
    const promptContent = await response.text();
    const lines = promptContent.split('\n');
    const voiceLine = lines.find(line => line.toLowerCase().startsWith('voice:'));
    const voice = voiceLine ? voiceLine.split(':')[1].trim() : 'defaultVoice';

    return { prompt: promptContent, voice };
  } catch (error) {
    logger.error(`Error loading prompt for character ${characterId}:`, error);
    throw new Error(`Cannot load prompt for character ${characterId}.`);
  }
}

async function updateCharacterStats(characterId: string) {
  try {
    const stats = JSON.parse(localStorage.getItem('characterStats') || '{}');
    stats[characterId] = (stats[characterId] || 0) + 1;
    localStorage.setItem('characterStats', JSON.stringify(stats));
    return stats;
  } catch (error) {
    logger.error('Error updating character stats:', error);
    return {};
  }
}

function filterAIResponse(text: string, characterId: string): string {
  logger.log('Filtering AI response for character:', characterId);
  logger.log('Original text:', text);
  
  let filteredText = text;
  
  AI_IDENTITY_FILTERS.forEach(rule => {
    const replacementValue = rule.replacement;

    if (rule.pattern instanceof RegExp) {
      if (rule.pattern.test(filteredText)) {
        logger.log('Matched AI identity rule (RegExp):', rule.pattern);
        if (typeof replacementValue === 'function') {
          filteredText = filteredText.replace(rule.pattern, replacementValue);
        } else {
          filteredText = filteredText.replace(rule.pattern, replacementValue || '');
        }
        logger.log('Text after AI identity rule (RegExp):', filteredText);
      }
    } else if (typeof rule.pattern === 'string') {
        const escapedPattern = rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedPattern, 'g'); 
        if (regex.test(filteredText)) {
            logger.log('Matched AI identity rule (string to RegExp):', regex);
            if (typeof replacementValue === 'function') {
              filteredText = filteredText.replace(regex, replacementValue);
            } else {
              filteredText = filteredText.replace(regex, replacementValue || '');
            }
            logger.log('Text after AI identity rule (string to RegExp):', filteredText);
        }
    }
  });
  
  if (CHARACTER_BASED_REPLACEMENTS) {
    Object.entries(CHARACTER_BASED_REPLACEMENTS).forEach(([phrase, replacements]) => {
      const pattern = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (pattern.test(filteredText)) {
        logger.log('Matched character-based replacement phrase:', phrase);
        filteredText = filteredText.replace(pattern, () => {
          const replacement = replacements[Math.floor(Math.random() * replacements.length)];
          logger.log(`Replacing "${phrase}" with "${replacement}"`);
          return replacement;
        });
         logger.log('Text after character-based replacement:', filteredText);
      }
    });
  }
  
  logger.log('Final filtered text:', filteredText);
  return filteredText;
}

let thinkingStatus = new Map<string, boolean>();

export function setThinkingStatus(characterId: string, status: boolean) {
  thinkingStatus.set(characterId, status);
}

export function getThinkingStatus(characterId: string): boolean {
  return thinkingStatus.get(characterId) || false;
}

export async function getThinkingMessage(characterId: string, languageInput?: string): Promise<string> {
  let currentLanguage = languageInput || i18n.language;
  try {
    logger.log('=== Thinking Message Debug ===', { characterId, language: currentLanguage });
    
    const character = await getCharacterPrompt(characterId);
    const nameMatch = character.prompt.match(/Name:\s*(\S+)/i);
    const name = nameMatch && nameMatch[1] ? nameMatch[1] : characterId;
    
    const message = i18n.t('chat.thinkingMessage', { 
      name,
      lng: currentLanguage,
      ns: 'translation'
    });
    
    logger.log('Generated thinking message:', {
      characterId,
      name,
      language: currentLanguage,
      message
    });
    
    return message;
  } catch (error) {
    logger.error('Error in getThinkingMessage:', error);
    return i18n.t('chat.thinking', { 
      lng: currentLanguage
    });
  }
}

export async function getLLMResponse(characterId: string, userInput: string): Promise<LLMResponse> {
  setThinkingStatus(characterId, true);
  try {
    let config = await getCharacterLLM(characterId);
    
    if (!config || !config.apiKey) {
      logger.warn(`Missing LLM configuration or API key for character ${characterId}, attempting to get a backup.`);
      const backupConfig = getBackupLLM(config?.type || LLM_TYPES.OPENROUTER);
      if (!backupConfig || !backupConfig.apiKey) {
        throw new Error('No valid LLM configuration or backup API key available.');
      }
      logger.log(`Using backup LLM: ${backupConfig.type}`);
      config = backupConfig;
    }

    const { prompt: characterPrompt, voice } = await getCharacterPrompt(characterId);
    const fullPrompt = `${characterPrompt}\n\nUser: ${userInput}\n\nYou:`;
    
    const modelToCall = getModelName(config.type, config.modelName);

    const response = await callLLMAPI(config.type, fullPrompt, config.apiKey, modelToCall);
      
    if (!response || !response.text) {
      throw new Error('Empty response from API');
    }

    const processedResponse = await processLLMResponse(response.text, characterPrompt, voice, characterId);
    return { text: processedResponse };

  } catch (error) {
    logger.error(`Error in getLLMResponse for character ${characterId}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('_AUTH_ERROR')) {
         return {
            text: i18n.t('chat.authErrorMesage', { llmType: errorMessage.split('_')[0] }),
            error: errorMessage
        };
    }

    return {
      text: i18n.t('chat.errorMessage'),
      error: errorMessage
    };
  } finally {
    setThinkingStatus(characterId, false);
  }
}

async function processLLMResponse(text: string, prompt: string, voice: string, characterId: string) {
  logger.log('Raw LLM response:', text);
  const filteredText = filterAIResponse(text, characterId);
  logger.log('Filtered LLM response:', filteredText);
  
  if ((AI_RESPONSE_MODE as string) === 'voice' && voice && filteredText) {
    try {
      await speak(filteredText, voice);
    } catch (speakError) {
      logger.error('Error during voice synthesis:', speakError);
    }
  }
  return filteredText;
}
