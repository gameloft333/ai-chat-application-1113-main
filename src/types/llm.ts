export type LLMType = 'zhipu' | 'moonshot' | 'gemini' | 'grok' | 'openrouter';

export type LLMModuleType = string;

export type LLMModelName = string;

export interface LLMConfig {
  type: LLMType;
  apiKey: string;
  modelName?: LLMModelName;
}

export interface LLMResponse {
  text: string;
  error?: string;
}