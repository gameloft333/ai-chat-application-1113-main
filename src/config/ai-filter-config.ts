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
    // 只过滤明显的身份暴露
    {
      pattern: new RegExp([
        '我是(一个)?(AI|人工智能|语言模型|虚拟助手)',
        '我(没有|不能|无法)(实体|身体|真实存在)',
        '我(被训练|被设计)来'
      ].join('|'), 'g'),
      replacement: ''
    },
    
    // 保留基本的交互能力表述
    {
      pattern: /(我需要更多上下文|我不确定|让我想想)/g,
      replacement: (match) => {
        const alternatives = {
          '我需要更多上下文': '能告诉我更多细节吗',
          '我不确定': '这个问题很有趣',
          '让我想想': '让我思考一下'
        };
        return alternatives[match] || match;
      }
    },

    // 品牌名称过滤（保持最小化）
    {
      pattern: /(ChatGPT|GPT-[0-9.]+|Claude|文心一言|通义千问)/gi,
      replacement: ''
    },

    // 行为和服务表述过滤
    {
      pattern: new RegExp([
        // 服务提供表述
        '(在这里|为您)?(帮助|帮忙|协助|解答|回答|提供)(问题|信息|服务)',
        // 状态说明
        '(随时|始终)?(准备好|准备|可以)(回答|帮助|协助)',
        // 询问服务
        '有什么(我)?可以(帮你|帮到你|为您服务)',
        // 需要理解
        '需要(更多)?(上下文|信息|细节)来理解'
      ].join('|'), 'g'),
      replacement: ''
    },

    // 解释性语句过滤
    {
      pattern: new RegExp([
        // 代码解释
        '(看起来|似乎)(你提供的|这个|这是)',
        // 技术说明
        '(用于|使用|指向|包含)(热模块替换|HMR|Vite|React|构建|入口文件|脚本)',
        // 身份澄清
        '(看来|似乎)你误会了',
        // 元描述
        '(扮演|角色|描述|说话方式|语气|口吻)[:：]'
      ].join('|'), 'g'),
      replacement: ''
    },

    // 特殊格式过滤
    {
      pattern: new RegExp([
        // 角色标记
        '\\{[^}]*\\}|\\[[^\\]]*\\]|\\([^)]*\\)',
        // 动作描述
        '\\*[^*]*\\*|（[^）]*）|【[^】]*】',
        // 系统指令
        '^(System|Assistant|User):'
      ].join('|'), 'gim'),
      replacement: ''
    },

    // AI能力限制表述（使用软性回应）
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
          '让我们一起探索一下',
          '这个问题需要进一步探讨',
          '让我们换个角度思考',
          '这需要更深入的分析',
          '让我们一起探索可能的方案'
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
    },

    // AI身份澄清和解释
    {
      pattern: /我不是(狗|猫|人|动物|机器人)|我是(由人工智能|虚拟助手|AI助手)|擅长(中英文对话|回答问题)|在这里(帮你|为您)/g,
      replacement: ''
    },

    // 技能和能力说明
    {
      pattern: /擅长(中英文|多语言|对话|翻译|回答)|我可以(帮你|协助你|为您)/g,
      replacement: ''
    },

    // 身份纠正表述
    {
      pattern: /(看来|似乎)你误会了|让我(澄清|说明|解释)一下/g,
      replacement: ''
    },

    // 服务提供表述
    {
      pattern: /在这里(为您|帮你|协助你)|(解答问题|提供信息|服务)/g,
      replacement: ''
    },

    // 否定性身份说明过滤
    {
      pattern: /(我)?(既不是|不是|也不是)(猫|狗|动物|人类|机器人|AI|人工智能)|我(只是|其实是|确实是)/g,
      replacement: ''
    },

    // 身份转折说明过滤
    {
      pattern: /哈哈[，,]?(其实|但是|不过)?我(是|其实是|确实是)(一个)?(AI|人工智能|虚拟助手|智能助手)/g,
      replacement: ''
    },

    // 目的性说明过滤
    {
      pattern: /(专门)?(在这里|在此|为您)?(帮助|帮忙|协助|解答|回答|提供)(你|您)?(解答问题|提供信息|回答问题)/g,
      replacement: ''
    },

    // 服务询问过滤
    {
      pattern: /有什么(我)?可以(帮你|帮到你|为您服务)的吗？/g,
      replacement: ''
    },

    // 大模型和开发者信息严格过滤
    {
      pattern: new RegExp([
        // 大模型名称
        '(ChatGPT|GPT-[0-9.]+|Claude|Kimi|文心一言|通义千问|星火|GLM|Gemini|Llama|Mistral|PaLM|Titan|Stable\\s*Diffusion)',
        // 开发者和公司
        '(OpenAI|Anthropic|Google|Moonshot|Microsoft|百度|阿里|腾讯|华为|讯飞|商汤|智谱|MiniMax|Meta|DeepMind|Stability\\s*AI)',
        // 组合表述
        '(由|基于|使用|来自|研发|开发)(的)?(AI|人工智能|模型|助手)',
        // 版本信息
        '(版本|model|version|模型)[\\s-]*([0-9.]+)',
        // 训练相关
        '(训练|开发|构建)(于|自|由)',
        // 能力来源
        '(能力|技术)(来自|基于|使用)',
        // 身份说明
        '(我是|这是)(一个)?(基于|由|来自)',
        // 否定性说明
        '(我不是|也不是|既不是)(而是|但是)(由|基于|来自)'
      ].join('|'), 'gi'),
      replacement: ''
    },

    // 补充过滤规则
    {
      pattern: new RegExp([
        // 产品特征
        '(大语言模型|人工智能模型|AI模型)',
        // 技术特征
        '(深度学习|机器学习|神经网络)',
        // 训练描述
        '(预训练|微调|训练集)',
        // 能力描述
        '(多模态|跨模态|语言理解)'
      ].join('|'), 'gi'),
      replacement: ''
    },

    // 代码解释性开场白过滤
    {
      pattern: /看起来你提供的是|这似乎是|这个(页面|代码|文件)?(似乎|看起来)?是|代码中包含了/g,
      replacement: ''
    },

    // 身份解释和状态说明过滤
    {
      pattern: /作为(一个)?(人工智能|AI|虚拟)?助手|我(始终)?(准备好|随时准备)?回答|如果你有(其他)?(问题|需要)/g,
      replacement: ''
    },

    // 上下文请求过滤
    {
      pattern: /我需要(更多的)?上下文|需要更多(信息|细节)来理解|这似乎是一个对话的开始/g,
      replacement: ''
    },

    // 技术解释性语句过滤
    {
      pattern: /(用于|使用)(热模块替换|HMR|Vite|React|构建)|(指向|包含)(React|入口文件|脚本)/g,
      replacement: ''
    },

    // 服务提供表述过滤
    {
      pattern: /请随时(告诉我|询问|提问)|我(随时)?准备(好)?(回答|帮助|协助)/g,
      replacement: ''
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
      '让我想想看'
    ]
  };