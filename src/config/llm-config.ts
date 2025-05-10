import { LLMConfig, LLMType } from '../types/llm';
import { LLM_TYPES, DEFAULT_MODEL_NAMES } from './llm-mapping';
import logger from '../utils/logger';

// 获取所有可用的 LLM 配置
const availableLLMs = [
  { type: 'zhipu' as LLMType, apiKey: import.meta.env.VITE_ZHIPU_API_KEY },
  { type: 'moonshot' as LLMType, apiKey: import.meta.env.VITE_MOONSHOT_API_KEY },
  { type: 'gemini' as LLMType, apiKey: import.meta.env.VITE_GEMINI_API_KEY },
  { type: 'openrouter' as LLMType, apiKey: import.meta.env.VITE_OPENROUTER_API_KEY }
].filter(llm => llm.apiKey);

// Log a warning if no API keys are found at module load time
if (availableLLMs.length === 0) {
  logger.warn(
    'CRITICAL: No general LLM API keys found in environment variables. Checked for: ' +
    'VITE_ZHIPU_API_KEY, VITE_MOONSHOT_API_KEY, VITE_GEMINI_API_KEY, VITE_OPENROUTER_API_KEY. ' +
    'LLM functionality will be severely limited or unavailable unless at least one key is provided in your .env file.'
  );
}

// 获取随机 LLM 配置
function getRandomLLM(): LLMConfig | null {
  if (availableLLMs.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * availableLLMs.length);
  const llm = availableLLMs[randomIndex];
  return {
    type: llm.type,
    apiKey: llm.apiKey,
    modelName: DEFAULT_MODEL_NAMES[llm.type],
  };
}

// 获取备用 LLM
function getBackupLLM(currentType: LLMType): LLMConfig | null {
  const backup = availableLLMs.find(llm => llm.type !== currentType && llm.apiKey);
  if (backup) {
    return {
      type: backup.type,
      apiKey: backup.apiKey,
      modelName: DEFAULT_MODEL_NAMES[backup.type],
    };
  }
  return null;
}

// 获取角色的 LLM 配置
function getCharacterLLM(characterId: string): LLMConfig {
  const generalCheckedKeysMessage = 'Please ensure at least one general LLM API key is set in your .env file. Checked for: VITE_ZHIPU_API_KEY, VITE_MOONSHOT_API_KEY, VITE_GEMINI_API_KEY, or VITE_OPENROUTER_API_KEY.';

  // 为 Elon Musk 指定使用 Grok
  if (characterId === 'elonmusk') {
    const grokApiKey = import.meta.env.VITE_GROK_API_KEY;
    if (grokApiKey) {
      return {
        type: 'grok' as LLMType,
        apiKey: grokApiKey,
        modelName: DEFAULT_MODEL_NAMES['grok']
      };
    } else {
      logger.warn('Grok API key (VITE_GROK_API_KEY) is missing for Elon Musk. Attempting to use a random backup LLM.');
      const backupLLM = getRandomLLM();
      if (!backupLLM) {
        throw new Error(
          'Failed to get LLM configuration for Elon Musk: Grok API key (VITE_GROK_API_KEY) is missing, AND no backup LLMs are available. ' +
          generalCheckedKeysMessage
        );
      }
      logger.log(`Using backup LLM for Elon Musk: ${backupLLM.type} (model: ${backupLLM.modelName})`);
      return backupLLM;
    }
  }

  // 其他角色使用随机 LLM
  const randomLLM = getRandomLLM();
  if (!randomLLM) {
    throw new Error(
      'Failed to get LLM configuration: No general LLM configurations available. ' +
      generalCheckedKeysMessage
    );
  }
  return randomLLM;
}

export const defaultLLMConfig: LLMConfig = {
  type: 'moonshot' as LLMType,
  apiKey: import.meta.env.VITE_MOONSHOT_API_KEY,
  modelName: DEFAULT_MODEL_NAMES['moonshot']
};

export { getCharacterLLM, getBackupLLM };