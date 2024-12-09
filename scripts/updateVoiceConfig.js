const fs = require('fs');
const path = require('path');

// 定义语音配置
const VOICE_CONFIGS = {
  voice_elon: {
    model: 'tts_models/en/vctk/vits',
    speaker_id: 'p336',
    language: 'en',
    speed: 1.0
  },
  // ... 其他默认配置
};

// 读取 @prompts 目录
const promptsDir = path.join(__dirname, '../public/prompts');
const files = fs.readdirSync(promptsDir);

// 遍历每个文件，提取角色信息
files.forEach(file => {
  const filePath = path.join(promptsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // 提取角色名称和语言
  const roleMatch = content.match(/Role:\s*(.+)/);
  const languageMatch = content.match(/language:\s*(\w+)/);

  if (roleMatch && languageMatch) {
    const roleName = roleMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
    const language = languageMatch[1].trim();

    // 根据角色名称更新 VOICE_CONFIGS
    VOICE_CONFIGS[`voice_${roleName}`] = {
      model: language === 'zh' ? 'tts_models/zh/baker/tacotron2-DDC' : 'tts_models/en/vctk/vits',
      language: language,
      speed: 1.0 // 可以根据需要调整速度
    };
  }
});

// 将更新后的 VOICE_CONFIGS 写入配置文件
const configFilePath = path.join(__dirname, '../src/config/voice-config.ts');
const configContent = `export const VOICE_CONFIGS = ${JSON.stringify(VOICE_CONFIGS, null, 2)};`;
fs.writeFileSync(configFilePath, configContent, 'utf-8');

console.log('语音配置已更新！'); 