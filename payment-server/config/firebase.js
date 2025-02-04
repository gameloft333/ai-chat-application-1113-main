import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import { existsSync, readFileSync } from 'fs';

// 根据环境加载配置
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.test';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 加载后端环境配置
dotenv.config({ path: path.resolve(process.cwd(), '.env.server') });

// 添加调试日志
console.log('环境文件加载检查：', {
    envPath: path.resolve(process.cwd(), '.env.server'),
    exists: require('fs').existsSync(path.resolve(process.cwd(), '.env.server')),
    currentDir: process.cwd(),
    dirContents: require('fs').readdirSync(process.cwd())
});

// 环境变量检查
console.log('Firebase 配置检查:', {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '未设置',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '已设置' : '未设置',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '已设置' : '未设置',
    NODE_ENV: process.env.NODE_ENV || '未设置'
});

// 验证必要的配置
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

// 在初始化 Firebase Admin 之前添加
console.log('私钥格式检查:', {
    length: process.env.FIREBASE_PRIVATE_KEY?.length,
    startsWith: process.env.FIREBASE_PRIVATE_KEY?.startsWith('-----BEGIN PRIVATE KEY-----'),
    endsWith: process.env.FIREBASE_PRIVATE_KEY?.endsWith('-----END PRIVATE KEY-----\n'),
    containsNewlines: process.env.FIREBASE_PRIVATE_KEY?.includes('\\n')
});

// 格式化私钥
const formatPrivateKey = (key) => {
    if (!key) return null;
    // 移除多余的引号
    key = key.replace(/^["']|["']$/g, '');
    // 确保换行符正确
    return key.includes('\\n') ? key : key.replace(/\\n/g, '\n');
};

// 初始化 Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY)
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