import { LLMConfig } from '../types/llm';
import { LLM_TYPES, DEFAULT_MODEL_NAMES } from './llm-mapping';

const availableLLMs = [
  { type: LLM_TYPES.ZHIPU, apiKey: import.meta.env.VITE_ZHIPU_API_KEY },
  { type: LLM_TYPES.MOONSHOT, apiKey: import.meta.env.VITE_MOONSHOT_API_KEY },
  { type: LLM_TYPES.GEMINI, apiKey: import.meta.env.VITE_GEMINI_API_KEY },
].filter(llm => llm.apiKey);

function getRandomLLM(): LLMConfig {
  const randomIndex = Math.floor(Math.random() * availableLLMs.length);
  const selectedLLM = availableLLMs[randomIndex];
  return {
    type: selectedLLM.type,
    apiKey: selectedLLM.apiKey,
    modelName: DEFAULT_MODEL_NAMES[selectedLLM.type],
  };
}

export const characterLLMConfig: Record<string, LLMConfig> = {
  bertha: getRandomLLM(),
  veronica: getRandomLLM(),
  mary: getRandomLLM(),
  dana: getRandomLLM(),
};

export const defaultLLMConfig: LLMConfig = getRandomLLM();