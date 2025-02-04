import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import https from 'https';

// ES Module 文件路径处理
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 根据环境加载配置
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.test';
console.log('当前环境:', process.env.NODE_ENV);
console.log('尝试加载环境文件:', envFile);

// 添加文件存在性检查
try {
    const envPath = path.resolve(process.cwd(), envFile);
    console.log('环境文件完整路径:', envPath);
    console.log('文件是否存在:', require('fs').existsSync(envPath));
    
    // 读取并打印文件内容（仅用于调试）
    const envContent = require('fs').readFileSync(envPath, 'utf8');
    console.log('环境文件内容预览 (前5行):', 
        envContent.split('\n').slice(0, 5).join('\n'));
} catch (err) {
    console.error('环境文件读取错误:', err);
}

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 打印所有环境变量（用于调试）
console.log('所有环境变量:', {
    NODE_ENV: process.env.NODE_ENV,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 20) + '...',
    // docker-compose中的环境变量
    DOCKER_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
    DOCKER_FIREBASE_CLIENT_EMAIL: process.env.VITE_FIREBASE_CLIENT_EMAIL,
    DOCKER_FIREBASE_PRIVATE_KEY: process.env.VITE_FIREBASE_PRIVATE_KEY?.substring(0, 20) + '...'
});

// 检查 docker-compose.prod.yml 中的环境变量传递
console.log('Docker Compose 环境变量检查:', {
    'process.env 中的键值:', Object.keys(process.env).filter(key => key.includes('FIREBASE')),
    '环境变量来源文件:', envFile,
    '当前工作目录:', process.cwd(),
    'NODE_ENV:', process.env.NODE_ENV
});

// 加载支付服务器配置
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '未设置',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '已设置' : '未设置',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '已设置' : '未设置',
    NODE_ENV: process.env.NODE_ENV || '未设置'
});

// 初始化 Firebase Admin
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('环境变量加载失败，请检查 docker-compose.prod.yml 中的配置：');
    console.error('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
    console.error('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '已设置' : '未设置');
    console.error('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '已设置' : '未设置');
    throw new Error('缺少必要的 Firebase 配置');
}

const app = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    httpAgent: new https.Agent({
        keepAlive: true,
        timeout: 30000,
        rejectUnauthorized: false
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

// 改为具名导出
export { db, withRetry };