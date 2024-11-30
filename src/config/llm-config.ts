import { LLMConfig } from '../types/llm';
import { LLM_TYPES, DEFAULT_MODEL_NAMES } from './llm-mapping';

// 获取所有可用的 LLM 配置
const availableLLMs = [
  { type: LLM_TYPES.ZHIPU, apiKey: import.meta.env.VITE_ZHIPU_API_KEY },
  { type: LLM_TYPES.MOONSHOT, apiKey: import.meta.env.VITE_MOONSHOT_API_KEY },
  { type: LLM_TYPES.GEMINI, apiKey: import.meta.env.VITE_GEMINI_API_KEY },
].filter(llm => llm.apiKey);

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
function getBackupLLM(currentType: string): LLMConfig | null {
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
  const randomLLM = getRandomLLM();
  if (!randomLLM) {
    throw new Error('没有可用的 LLM 配置');
  }
  return randomLLM;
}

export const defaultLLMConfig: LLMConfig = {
  type: LLM_TYPES.MOONSHOT,
  apiKey: import.meta.env.VITE_MOONSHOT_API_KEY,
  modelName: DEFAULT_MODEL_NAMES.MOONSHOT
};

export { getCharacterLLM, getBackupLLM };