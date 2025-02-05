import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module 文件路径处理
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 根据环境加载配置
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.test';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 加载后端环境配置
dotenv.config({ path: path.resolve(process.cwd(), '.env.server') });

// 添加调试日志
console.log('环境文件加载检查：', {
    envPath: path.resolve(process.cwd(), '.env.server'),
    exists: existsSync(path.resolve(process.cwd(), '.env.server')),
    currentDir: process.cwd(),
    dirContents: readdirSync(process.cwd())
});

// 环境变量检查
console.log('Firebase 配置检查:', {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '未设置',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '已设置' : '未设置',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '已设置' : '未设置',
    NODE_ENV: process.env.NODE_ENV || '未设置'
});

console.log('当前目录:', process.cwd());
console.log('环境文件路径:', path.resolve(process.cwd(), '.env.production'));
console.log('环境文件是否存在:', existsSync(path.resolve(process.cwd(), '.env.production')));

// 验证必要的配置
if (process.env.SKIP_FIREBASE_CHECK !== 'true') {
    if (!process.env.FIREBASE_PROJECT_ID || 
        !process.env.FIREBASE_CLIENT_EMAIL || 
        !process.env.FIREBASE_PRIVATE_KEY) {
      console.error('环境变量加载失败，请检查配置：', {
          PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
          CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
          PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY
      });
      throw new Error('缺少必要的 Firebase 配置');
    }
  } else {
    console.log('跳过 Firebase 配置检查');
  }

// 格式化私钥
const formatPrivateKey = (key) => {
    if (!key) {
        console.error('私钥未设置');
        return null;
    }

    // 移除可能存在的引号
    key = key.replace(/^["']|["']$/g, '');
    
    // 检查私钥格式
    if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('私钥格式错误：缺少开始标记');
        return null;
    }
    
    if (!key.includes('-----END PRIVATE KEY-----')) {
        console.error('私钥格式错误：缺少结束标记');
        return null;
    }

    // 添加调试日志
    console.log('私钥格式检查:', {
        length: key.length,
        hasStartMarker: key.includes('-----BEGIN PRIVATE KEY-----'),
        hasEndMarker: key.includes('-----END PRIVATE KEY-----'),
        containsNewlines: key.includes('\\n')
    });

    // 处理换行符
    const formattedKey = key.replace(/\\n/g, '\n');
    
    // 验证格式化后的私钥
    if (!formattedKey.startsWith('-----BEGIN PRIVATE KEY-----\n')) {
        console.error('格式化后的私钥格式错误');
        return null;
    }

    return formattedKey;
};

// 初始化 Firebase Admin 之前添加验证
const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
if (!privateKey) {
    throw new Error('私钥格式化失败');
}

// 初始化 Firebase Admin
const app = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    httpAgent: new https.Agent({
        keepAlive: true,
        timeout: 30000,
        rejectUnauthorized: false
    })
});

// 获取 Firestore 实例并配置重试
const db = getFirestore(app);
db.settings({
    ignoreUndefinedProperties: true,
    retry: {
        maxRetries: 5,
        retryDelayMs: 1000
    },
    timeout: 30000 // 设置超时时间为30秒
});

// 添加重试包装器
const withRetry = async (operation, maxAttempts = 5) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`尝试执行操作 (${attempt}/${maxAttempts})`);
            return await operation();
        } catch (error) {
            lastError = error;
            console.error(`操作失败 (${attempt}/${maxAttempts}):`, error);
            
            if (error.code === 14 || error.code === 'ETIMEDOUT') {
                console.log('检测到连接超时，等待重试...');
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                continue;
            }
            
            if (attempt === maxAttempts) {
                console.error('达到最大重试次数，操作失败');
                throw lastError;
            }
            
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
    }
    throw lastError;
};

export { db, withRetry }; 