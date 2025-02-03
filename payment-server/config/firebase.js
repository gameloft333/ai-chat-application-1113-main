import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// 添加调试日志
console.log('Firebase 配置检查:', {
  projectId: process.env.FIREBASE_PROJECT_ID ? '已设置' : '未设置',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '已设置' : '未设置',
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? '已设置' : '未设置'
});

// 初始化 Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
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