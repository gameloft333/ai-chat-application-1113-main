import { Character } from '../types/character';
import { FilterRule } from '../config/ai-filter-config';

interface CharacterTrait {
  domain: string;
  keywords: string[];
  personality: string[];
}

interface DomainRules {
  [key: string]: string[];
}

export class CharacterTraitsService {
  private static readonly domainRules: DomainRules = {
    技术: ['编程', '开发', '工程', '算法'],
    艺术: ['创作', '设计', '艺术', '美学'],
    文化: ['传统', '文学', '历史', '文化'],
    智慧: ['思考', '分析', '研究', '哲学']
  };

  private static readonly RESPONSE_TEMPLATES = {
    '我不确定': [
      '让我从{domain}的角度思考一下',
      '这需要从{domain}的视角来看',
      '让我用{domain}的方式来理解',
      '从{domain}的层面来分析'
    ],
    '我不知道': [
      '这个问题需要结合{domain}来研究',
      '让我用{domain}的知识来解答',
      '这需要通过{domain}来探索',
      '让我从{domain}的角度来分析'
    ]
  };

  private static readonly AI_IDENTITY_PATTERNS = {
    // AI身份直接表述
    IDENTITY: [
      '我是.*?AI',
      '我是.*?语言模型',
      '我是.*?助手',
      '我没有名字',
      '我是.*?机器人',
      '我是.*?人工智能'
    ],
    // AI平台和产品名称
    PLATFORMS: [
      'ChatGPT',
      'GPT',
      'OpenAI',
      'Gemini',
      'Google',
      '谷歌',
      'Claude',
      'Anthropic',
      'Kimi',
      'DeepSeek',
      '文心一言',
      '讯飞星火',
      '通义千问',
      '智谱',
      'Moonshot',
      'Mixtral',
      'LLaMA',
      'Llama',
      '千帆',
      'Qwen',
      '通义',
      'Stable Diffusion',
      'Midjourney',
      'DALL·E'
    ],
    // AI特征表述
    FEATURES: [
      '我被训练',
      '我被设计',
      '我的训练数据',
      '我的知识库',
      '我的程序',
      '我的系统',
      '我的功能',
      '作为.*?AI',
      '身为.*?助手',
      '作为.*?模型'
    ],
    // AI能力限制表述
    LIMITATIONS: [
      '我不能',
      '我做不到',
      '这超出了我的能力',
      '我没有实体',
      '我无法感知',
      '我不能感受',
      '我的知识仅限于'
    ]
  };

  private static readonly SOFT_RESPONSES = [
    '这个可能有点难度',
    '让我想想看',
    '这个问题比较复杂',
    '或许我们可以换个方式',
    '这需要进一步探讨',
    '这个问题很有意思',
    '让我们一起探索一下'
  ];

  private static createAIIdentityFilters(): FilterRule[] {
    const rules: FilterRule[] = [];

    // 添加身份过滤规则
    rules.push({
      pattern: new RegExp(this.AI_IDENTITY_PATTERNS.IDENTITY.join('|'), 'g'),
      replacement: ''
    });

    // 添加平台名称过滤规则
    rules.push({
      pattern: new RegExp(this.AI_IDENTITY_PATTERNS.PLATFORMS.join('|'), 'gi'),
      replacement: ''
    });

    // 添加特征表述过滤规则
    rules.push({
      pattern: new RegExp(this.AI_IDENTITY_PATTERNS.FEATURES.join('|'), 'g'),
      replacement: ''
    });

    // 添加能力限制过滤规则
    rules.push({
      pattern: new RegExp(this.AI_IDENTITY_PATTERNS.LIMITATIONS.join('|'), 'g'),
      replacement: () => this.SOFT_RESPONSES[Math.floor(Math.random() * this.SOFT_RESPONSES.length)]
    });

    return rules;
  }

  public static async generateCharacterFilters(characterId: string): Promise<FilterRule[]> {
    const character = characters.find(c => c.id === characterId);
    if (!character) return [];

    const trait = await this.generateCharacterTraits(character);
    
    // 合并角色特征过滤规则和 AI 身份过滤规则
    return [
      ...this.createAIIdentityFilters(),
      ...this.createFilterRules(trait)
    ];
  }

  private static async generateCharacterTraits(character: Character): Promise<CharacterTrait> {
    try {
      const content = await this.loadPromptFile(character.promptFile);
      const lines = content.split('\n');
      
      const profileLine = lines.find(line => line.startsWith('Profile:'));
      const backgroundLine = lines.find(line => line.startsWith('Background:'));
      
      const keywords = this.extractKeywords(profileLine + backgroundLine);
      const domain = this.determineDomain(keywords);
      const personality = this.extractPersonality(profileLine);

      return {
        domain,
        keywords,
        personality
      };
    } catch (error) {
      console.error(`Error generating traits for character ${character.id}:`, error);
      return this.getDefaultTraits();
    }
  }

  private static async loadPromptFile(promptFile: string): Promise<string> {
    const response = await fetch(`/prompts/${promptFile}`);
    return response.text();
  }

  private static extractKeywords(text: string): string[] {
    // 实现关键词提取逻辑
    const keywords: string[] = [];
    // ... 关键词提取实现
    return keywords;
  }

  private static determineDomain(keywords: string[]): string {
    // 根据关键词匹配最适合的领域
    let maxMatches = 0;
    let bestDomain = '通用';

    Object.entries(this.domainRules).forEach(([domain, rules]) => {
      const matches = rules.filter(rule => 
        keywords.some(keyword => keyword.includes(rule))
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestDomain = domain;
      }
    });

    return bestDomain;
  }

  private static extractPersonality(profileText: string = ''): string[] {
    // 提取性格特征
    const personality: string[] = [];
    // ... 性格特征提取实现
    return personality;
  }

  private static createFilterRules(trait: CharacterTrait): FilterRule[] {
    const rules: FilterRule[] = [];
    
    Object.entries(this.RESPONSE_TEMPLATES).forEach(([pattern, templates]) => {
      rules.push({
        pattern: new RegExp(pattern, 'g'),
        replacement: () => {
          const template = templates[Math.floor(Math.random() * templates.length)];
          const keyword = trait.keywords[Math.floor(Math.random() * trait.keywords.length)];
          return template.replace('{domain}', keyword);
        }
      });
    });

    return rules;
  }

  private static getDefaultTraits(): CharacterTrait {
    return {
      domain: '通用',
      keywords: ['交流', '对话', '互动'],
      personality: ['友好', '热情']
    };
  }
}