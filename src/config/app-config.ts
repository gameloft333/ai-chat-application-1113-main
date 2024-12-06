export const MAX_CHAT_HISTORY = 50; // 设置最大聊天记录条数
export const CLEAR_MEMORY_ON_RESTART = true; // 设置是否在重启时清空记忆
export const USE_TYPEWRITER_MODE = true; // 设置为 true 使用打字机模式，false 为一次性输出
export const AI_RESPONSE_MODE = 'text'; // 可选值: 'text', 'voice', 'text_and_voice'
export const DEBUG_MODE = process.env.NODE_ENV === 'development';

// 跑马灯配置
export const MARQUEE_CONFIG = {
  enabled: import.meta.env.VITE_MARQUEE_ENABLED === 'true', // 是否启用跑马灯
  animationDuration: import.meta.env.VITE_MARQUEE_ANIMATION_DURATION || 20000, // 动画持续时间
  position: 'top', // 显示位置
  zIndex: 50, // 层级
}




