import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// ES Module 文件路径处理
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 根据环境加载配置
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.test';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 添加调试日志
console.log('环境变量检查开始...');
console.log('当前目录:', process.cwd());
console.log('环境文件路径:', path.resolve(process.cwd(), envFile));

// 使用 ES Module 方式读取目录
try {
    const files = readdirSync(process.cwd());
    console.log('当前目录文件列表:', files);
} catch (err) {
    console.error('读取目录失败:', err);
}

// 环境变量检查
console.log('Firebase 配置检查:', {
    projectId: process.env.FIREBASE_PROJECT_ID ? '已设置' : '未设置',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '已设置' : '未设置',
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? '已设置' : '未设置',
    NODE_ENV: process.env.NODE_ENV,
    环境变量详情: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 5) + '...',
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? '存在' : '不存在',
        当前环境: process.env.NODE_ENV
    }
});

// 初始化 Firebase Admin
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('环境变量加载失败，请检查以下配置：');
    console.error('- FIREBASE_PROJECT_ID');
    console.error('- FIREBASE_CLIENT_EMAIL');
    console.error('- FIREBASE_PRIVATE_KEY');
    console.error('当前环境:', process.env.NODE_ENV);
    console.error('环境文件路径:', path.resolve(process.cwd(), envFile));
    throw new Error('缺少必要的 Firebase 配置');
}

const app = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
});

const db = getFirestore(app);

// 配置 Firestore
db.settings({
    ignoreUndefinedProperties: true,
    retry: {
        maxRetries: 5,
        retryDelayMs: 1000
    },
    timeout: 30000
});

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

// 改为具名导出
export { db, withRetry };