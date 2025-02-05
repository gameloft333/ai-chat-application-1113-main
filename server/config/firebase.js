import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import { existsSync } from 'fs';

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

// 验证环境变量的函数
const validateEnvVariables = () => {
    // 定义所有可能的环境变量名称（包括带VITE_前缀的）
    const requiredVars = [
        { name: 'FIREBASE_PROJECT_ID', altNames: ['VITE_FIREBASE_PROJECT_ID'] },
        { name: 'FIREBASE_CLIENT_EMAIL', altNames: ['VITE_FIREBASE_CLIENT_EMAIL'] },
        { name: 'FIREBASE_PRIVATE_KEY', altNames: ['VITE_FIREBASE_PRIVATE_KEY', 'PRIVATE_KEY'] },
        { name: 'FIREBASE_DATABASE_URL', altNames: ['VITE_FIREBASE_DATABASE_URL'] }
    ];

    // 收集缺失的变量
    const missingVars = [];

    // 详细的环境变量检查日志
    const envVarsLog = {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        workingDirectory: process.cwd(),
        envFiles: {
            production: existsSync(path.resolve(process.cwd(), '.env.production')),
            test: existsSync(path.resolve(process.cwd(), '.env.test')),
            server: existsSync(path.resolve(process.cwd(), '.env.server'))
        },
        envVars: {},
        missingVars: [],
        dockerEnv: {
            inContainer: existsSync('/.dockerenv'),
            hostname: process.env.HOSTNAME
        }
    };

    // 检查每个必需变量
    requiredVars.forEach(varConfig => {
        // 尝试获取主变量或备选变量
        const varValue = process.env[varConfig.name] || 
                         varConfig.altNames.reduce((val, altName) => val || process.env[altName], null);

        // 记录变量信息
        envVarsLog.envVars[varConfig.name] = {
            exists: !!varValue,
            length: varValue ? varValue.length : 0,
            preview: varValue ? varValue.substring(0, 10) + '...' : 'undefined'
        };

        // 如果没有找到有效值，添加到缺失变量列表
        if (!varValue) {
            missingVars.push(varConfig.name);
            envVarsLog.missingVars.push(varConfig.name);
        }
    });

    // 记录完整的环境变量检查结果
    console.log('环境变量验证结果:', JSON.stringify(envVarsLog, null, 2));

    // 如果启用了跳过检查，不抛出错误
    if (process.env.SKIP_FIREBASE_CHECK === 'true') {
        console.log('跳过 Firebase 配置检查');
        return;
    }

    // 如果有缺失变量，抛出错误
    if (missingVars.length > 0) {
        console.error(`缺少必要的环境变量: ${missingVars.join(', ')}`);
        throw new Error(`缺少必要的环境变量: ${missingVars.join(', ')}`);
    }
};

// 在初始化 Firebase 之前添加验证
validateEnvVariables();

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