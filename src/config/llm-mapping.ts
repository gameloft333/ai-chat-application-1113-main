import { LLMType, LLMModuleType, LLMModelName } from '../types/llm';

// LLM 类型映射
export const LLM_TYPES: Record<string, LLMType> = {
  ZHIPU: 'zhipu',
  MOONSHOT: 'moonshot',
  GEMINI: 'gemini',
  GROK: 'grok'
};

// LLM 模块映射
export const LLM_MODULES: Record<LLMType, LLMModuleType> = {
  [LLM_TYPES.ZHIPU]: 'zhipu-ai',
  [LLM_TYPES.MOONSHOT]: 'moonshot-ai',
  [LLM_TYPES.GEMINI]: '@google/generative-ai',
};

// LLM 模型名称映射
export const LLM_MODEL_NAMES: Record<LLMType, LLMModelName[]> = {
  [LLM_TYPES.ZHIPU]: ['chatglm_turbo', 'chatglm_pro', 'chatglm_std'],
  [LLM_TYPES.MOONSHOT]: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  [LLM_TYPES.GEMINI]: ['gemini-pro', 'gemini-pro-vision'],
};

// 默认模型名称
export const DEFAULT_MODEL_NAMES: Record<LLMType, LLMModelName> = {
  [LLM_TYPES.ZHIPU]: 'chatglm_turbo',
  [LLM_TYPES.MOONSHOT]: 'moonshot-v1-8k',
  [LLM_TYPES.GEMINI]: 'gemini-pro',
  [LLM_TYPES.GROK]: 'grok-beta'
};