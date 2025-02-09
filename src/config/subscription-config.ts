export const SUBSCRIPTION_CONFIG = {
  // 控制各个时长标签的显示
  durationTabs: {
    '24months': true,
    '12months': true,
    '1month': true,
    'short_term': true,
    '1week': true,
    '1day': true
  },
  
  // 控制各个套餐的显示
  planVisibility: {
    basic: true,
    pro: true,
    premium: true,
    trial: true,
    test: true
  }
};

// 订阅计划配置
export const SUBSCRIPTION_PLANS = {
  // 不同等级可用的角色数量
  CHARACTER_LIMITS: {
    'normal': -1,     // 普通用户（非会员）
    'trial': -1,      // 试用会员
    'basic': -1,      // 基础会员
    'pro': -1,       // 专业会员
    'premium': -1    // 高级会员（-1 表示无限制）
  },
  
  // 默认配置
  DEFAULT: {
    SUBSCRIPTION_TYPE: 'normal'  // 默认为普通用户
  },
  
  // 计划特性配置
  FEATURES: {
    'normal': {
      maxCharacters: 1,
      maxChatsPerDay: 20,
      // 其他特性...
    },
    'trial': {
      maxCharacters: 3,
      maxChatsPerDay: 50,
      // 其他特性...
    },
    'basic': {
      maxCharacters: 8,
      maxChatsPerDay: 100,
      // 其他特性...
    },
    'pro': {
      maxCharacters: 15,
      maxChatsPerDay: 500,
      // 其他特性...
    },
    'premium': {
      maxCharacters: -1, // 无限制
      maxChatsPerDay: -1,
      // 其他特性...
    }
  }
} as const; 