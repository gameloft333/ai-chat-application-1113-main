import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';

// 根据环境加载配置
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.test';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 加载后端环境配置
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env.server') });

// 格式化私钥
const formatPrivateKey = (key) => {
    // 添加详细的调试日志
    console.log('私钥格式化开始:', {
        keyProvided: !!key,
        keyType: typeof key,
        keyLength: key ? key.length : 'N/A',
        keyFirstChars: key ? key.substring(0, 20) : 'N/A'
    });

    // 如果没有提供私钥，记录错误并返回null
    if (!key) {
        console.error('私钥未设置：传入的私钥为空或未定义');
        return null;
    }

    // 尝试处理可能的引号和转义问题
    let cleanedKey = key.trim();
    
    // 移除可能存在的引号（单引号或双引号）
    cleanedKey = cleanedKey.replace(/^["']|["']$/g, '');

    // 处理可能的转义换行符
    cleanedKey = cleanedKey.replace(/\\n/g, '\n');

    // 检查私钥是否包含必要的开始和结束标记
    if (!cleanedKey.includes('-----BEGIN PRIVATE KEY-----') || 
        !cleanedKey.includes('-----END PRIVATE KEY-----')) {
        console.error('私钥格式错误：缺少开始或结束标记', {
            hasStartMarker: cleanedKey.includes('-----BEGIN PRIVATE KEY-----'),
            hasEndMarker: cleanedKey.includes('-----END PRIVATE KEY-----')
        });
        return null;
    }

    // 添加最终的调试日志
    console.log('私钥格式化结果:', {
        keyLength: cleanedKey.length,
        firstChars: cleanedKey.substring(0, 20),
        lastChars: cleanedKey.substring(cleanedKey.length - 20)
    });

    return cleanedKey;
};

// 在初始化 Firebase 之前添加验证
const privateKey = formatPrivateKey(
    process.env.FIREBASE_PRIVATE_KEY || 
    process.env.VITE_FIREBASE_PRIVATE_KEY || 
    process.env.PRIVATE_KEY
);

// 如果跳过检查，则不抛出错误
if (process.env.SKIP_FIREBASE_CHECK !== 'true') {
    if (!privateKey) {
        console.error('私钥格式化失败：', {
            FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
            VITE_FIREBASE_PRIVATE_KEY: !!process.env.VITE_FIREBASE_PRIVATE_KEY,
            PRIVATE_KEY: !!process.env.PRIVATE_KEY
        });
        throw new Error('私钥格式化失败');
    }
} else {
    console.log('跳过私钥检查')
}

// 初始化 Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL,
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