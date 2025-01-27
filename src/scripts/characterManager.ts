// 脚本功能：用于将 character.ts 导出到csv文件，方便编辑
//使用方法:
//  导出角色: npm run characters export [输出文件路径]
//  导入角色: npm run characters import [输入文件路径]

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { Character, characters } from '../types/character.js';

// 获取 __dirname 的 ES modules 替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CSV文件的列定义
const CSV_HEADERS = [
  'id',
  'name',
  'profile',
  'image',
  'promptFile',
  'avatarFile',
  'gender',
  'borderColor',
  'en_age',
  'en_description',
  'zh_age',
  'zh_description'
];

// 默认导出目录
const DEFAULT_EXPORT_DIR = 'data/characters';

// 添加状态检查函数
function checkAndCreateDirectory(dir: string): boolean {
  try {
    if (!fs.existsSync(dir)) {
      console.log(`目录 ${dir} 不存在，正在创建...`);
      fs.mkdirSync(dir, { recursive: true });
      console.log(`目录 ${dir} 创建成功`);
    } else {
      console.log(`目录 ${dir} 已存在`);
    }
    return true;
  } catch (error) {
    console.error(`创建目录 ${dir} 失败:`, error);
    return false;
  }
}

// 导出角色到CSV
export function exportCharactersToCSV(outputPath: string = 'characters.csv'): boolean {
  console.log('\n=== 开始导出角色数据 ===');
  console.log('当前工作目录:', process.cwd());
  
  try {
    // 获取完整的输出路径
    const fullPath = path.resolve(process.cwd(), outputPath);
    console.log('完整导出路径:', fullPath);
    
    // 确保导出目录存在
    const exportDir = path.dirname(fullPath);
    console.log('导出目录:', exportDir);
    
    // 检查并创建目录
    if (!checkAndCreateDirectory(exportDir)) {
      return false;
    }

    // 检查角色数据
    if (!characters || characters.length === 0) {
      console.error('错误: 没有找到角色数据');
      return false;
    }
    console.log('准备导出角色数量:', characters.length);
    
    // 将角色数组转换为CSV格式
    const csvContent = stringify(characters.map(char => ({
      id: char.id || '',
      name: char.name || '',
      profile: char.profile || '',
      image: char.image || '',
      promptFile: char.promptFile || '',
      avatarFile: char.avatarFile || '',
      gender: char.gender || '',
      borderColor: char.borderColor || '',
      en_age: char.i18n?.en?.age || '',
      en_description: char.i18n?.en?.description || '',
      zh_age: char.i18n?.zh?.age || '',
      zh_description: char.i18n?.zh?.description || ''
    })), {
      header: true,
      columns: CSV_HEADERS,
      record_delimiter: '\n',  // 明确指定换行符
      quoted: true,           // 给所有字段加引号
      quoted_empty: true      // 空值也加引号
    });

    // 添加 BOM 头以解决 Excel 打开的中文乱码问题
    const BOM = '\ufeff';
    fs.writeFileSync(fullPath, BOM + csvContent, { encoding: 'utf8' });
    
    // 验证文件是否成功创建
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`成功导出角色数据到: ${fullPath}`);
      console.log(`文件大小: ${stats.size} bytes`);
      console.log('=== 导出完成 ===\n');
      return true;
    } else {
      console.error('错误: 文件写入失败');
      return false;
    }
  } catch (error) {
    console.error('导出角色数据时发生错误:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.stack);
    }
    return false;
  }
}

// 从CSV导入角色
export function importCharactersFromCSV(inputPath: string = 'characters.csv'): Character[] {
  try {
    // 读取CSV文件
    const fileContent = fs.readFileSync(inputPath, 'utf-8');
    
    // 解析CSV内容
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    // 转换为Character类型
    const importedCharacters: Character[] = records.map((record: any) => {
      // 确保有 id，如果没有则用 name 转小写作为 id
      const id = record.id || record.name.toLowerCase().replace(/\s+/g, '');
      
      return {
        id,
        name: record.name,
        profile: record.profile || '',
        image: record.image,
        promptFile: record.promptFile,
        avatarFile: record.avatarFile,
        gender: record.gender as 'male' | 'female' | undefined,
        borderColor: record.borderColor as Character['borderColor'] || undefined,
        i18n: {
          en: {
            age: record.en_age || '',
            description: record.en_description || ''
          },
          zh: {
            age: record.zh_age || '',
            description: record.zh_description || ''
          }
        }
      };
    });

    console.log(`成功从 ${inputPath} 导入 ${importedCharacters.length} 个角色`);
    return importedCharacters;
  } catch (error) {
    console.error('导入角色数据时发生错误:', error);
    return [];
  }
}

// 更新character.ts文件
export function updateCharacterFile(characters: Character[]): void {
  try {
    const characterFileContent = `
import { Character } from './types.js';

export const characters: Character[] = ${JSON.stringify(characters, null, 2)};
`;

    fs.writeFileSync(
      path.resolve(__dirname, '../types/character.ts'),
      characterFileContent,
      'utf-8'
    );
    console.log('成功更新 character.ts 文件');
  } catch (error) {
    console.error('更新character.ts文件时发生错误:', error);
  }
}

// 主函数
function main() {
  console.log('\n=== 角色管理工具 ===');
  console.log('当前时间:', new Date().toLocaleString());
  console.log('进程参数:', process.argv);
  
  const command = process.argv[2];
  const filePath = process.argv[3] || path.join(DEFAULT_EXPORT_DIR, 'characters.csv');

  console.log('运行命令:', command);
  console.log('文件路径:', filePath);

  let success = false;
  
  switch (command) {
    case 'export':
      success = exportCharactersToCSV(filePath);
      break;
    case 'import':
      const importedCharacters = importCharactersFromCSV(filePath);
      success = importedCharacters.length > 0;
      if (success) {
        updateCharacterFile(importedCharacters);
      }
      break;
    default:
      console.log(`
使用方法:
  导出角色: npm run characters export [输出文件路径]
  导入角色: npm run characters import [输入文件路径]
      `);
      return;
  }

  console.log(`\n执行结果: ${success ? '成功' : '失败'}`);
  process.exit(success ? 0 : 1);
}

// 直接执行主函数，不需要条件判断
main(); 