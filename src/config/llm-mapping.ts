import { LLMType, LLMModuleType, LLMModelName } from '../types/llm';

// LLM 类型映射
export const LLM_TYPES = {
  ZHIPU: 'zhipu',
  MOONSHOT: 'moonshot',
  GEMINI: 'gemini',
  GROK: 'grok',
  OPENROUTER: 'openrouter'
} as const;

// LLM 模块映射
export const LLM_MODULES: Record<LLMType, LLMModuleType> = {
  'zhipu': 'zhipu-ai',
  'moonshot': 'moonshot-ai',
  'gemini': '@google/generative-ai',
  'grok': 'grok-api', // Placeholder for API based
  'openrouter': 'openrouter-api' // Placeholder for API based
};

// LLM 模型名称映射
export const LLM_MODEL_NAMES: Record<LLMType, LLMModelName[]> = {
  'zhipu': ['chatglm_turbo', 'chatglm_pro', 'chatglm_std'],
  'moonshot': ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  'gemini': ['gemini-pro', 'gemini-pro-vision'],
  'grok': ['grok-beta'], 
  'openrouter': [] // OpenRouter uses dynamic model fetching
};

// 默认模型名称
export const DEFAULT_MODEL_NAMES: Record<LLMType, LLMModelName> = {
  'zhipu': 'chatglm_turbo',
  'moonshot': 'moonshot-v1-8k',
  'gemini': 'gemini-pro',
  'grok': 'grok-beta',
  'openrouter': 'openrouter/random-free'
};