import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

// 根据环境加载配置
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.test';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 添加调试日志
console.log('当前工作目录:', process.cwd());
console.log('环境文件路径:', path.resolve(process.cwd(), envFile));
console.log('Firebase 配置检查:', {
  projectId: process.env.FIREBASE_PROJECT_ID ? '已设置' : '未设置',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '已设置' : '未设置',
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? '已设置' : '未设置',
  NODE_ENV: process.env.NODE_ENV
});

// 初始化 Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

// 获取 Firestore 实例
const db = getFirestore(app);

// 简化版重试包装器
const withRetry = async (operation, maxAttempts = 5) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`尝试执行操作 (${attempt}/${maxAttempts})`);
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`操作失败 (${attempt}/${maxAttempts}):`, error);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
};

export { db, withRetry };