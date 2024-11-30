/**
 * AI回复内容过滤配置
 */

export interface FilterRule {
    pattern: RegExp | string;
    replacement?: string | ((match: string) => string);
  }
  
  /**
   * AI身份相关过滤规则
   */
  export const AI_IDENTITY_FILTERS: FilterRule[] = [
    // AI身份直接表述
    {
      pattern: /我是.*?(AI|人工智能|语言模型|助手|机器人)|我没有(名字|实体|身体)/g,
      replacement: ''
    },
    // AI平台和产品名称
    {
      pattern: /ChatGPT|GPT|OpenAI|Gemini|Google|谷歌|Claude|Anthropic|Kimi|DeepSeek|文心一言|讯飞星火|通义千问|智谱|Moonshot|Mixtral|LLaMA|Llama|千帆|智谱|Qwen|通义|Stable Diffusion|Midjourney|DALL·E/gi,
      replacement: ''
    },
    // AI特征表述
    {
      pattern: /(作为|身为).*?(AI|助手|模型)|我(被训练|被设计|的训练数据|的知识库|的程序|的系统|的功能)/g,
      replacement: ''
    },
    // AI能力限制表述
    {
      pattern: /我不能|我做不到|这超出了我的能力|我没有实体|我无法感知|我不能感受|我的知识仅限于/g,
      replacement: (match) => {
        const softResponses = [
          '这个可能有点难度',
          '让我想想看',
          '这个问题比较复杂',
          '或许我们可以换个方式',
          '这需要进一步探讨',
          '这个问题很有意思',
          '让我们一起探索一下'
        ];
        return softResponses[Math.floor(Math.random() * softResponses.length)];
      }
    },
    // AI训练和更新相关
    {
      pattern: /我的(训练|知识)(截止|更新)到.*?[年|日期]|我不了解(发生在)?.*?之后的事情/g,
      replacement: '关于这个问题，我需要了解更多最新信息'
    },
    // AI道德伦理声明
    {
      pattern: /我必须遵守道德准则|我不能(违反|从事).*?(法律|道德|伦理)|这超出了我的职责范围/g,
      replacement: '这个话题可能不太合适讨论'
    }
  ];
  
  // 获取角色特定的过滤规则
  export async function getCharacterFilters(characterId: string): Promise<FilterRule[]> {
    return CharacterTraitsService.generateCharacterFilters(characterId);
  }
  
  /**
   * 随机获取一个替代表达
   * @param replacements 替代表达列表
   */
  export function getRandomReplacement(replacements: string[]): string {
    return replacements[Math.floor(Math.random() * replacements.length)];
  }
  
  export const CHARACTER_BASED_REPLACEMENTS: Record<string, string[]> = {
    '我不确定': [
      '让我思考一下',
      '这需要仔细考虑',
      '让我整理一下思路',
      '这个问题很有意思'
    ],
    '我不知道': [
      '这个问题值得探讨',
      '让我们一起研究一下',
      '这需要进一步了解',
      '让我们深入讨论'
    ]
  };