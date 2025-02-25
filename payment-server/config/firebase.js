import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module 文件路径处理
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. 根据环境加载主配置
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.test';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 2. 加载后端环境配置
dotenv.config({ path: path.resolve(process.cwd(), '.env.server') });

// 添加更详细的调试日志
console.log('环境变量加载诊断:', {
    NODE_ENV: process.env.NODE_ENV,
    CWD: process.cwd(),
    envFile,
    envPath: path.resolve(process.cwd(), envFile),
    serverEnvPath: path.resolve(process.cwd(), '.env.server'),
    allEnvFiles: readdirSync(process.cwd()).filter(file => file.startsWith('.env')),
    envExists: {
        production: existsSync(path.resolve(process.cwd(), '.env.production')),
        test: existsSync(path.resolve(process.cwd(), '.env.test')),
        server: existsSync(path.resolve(process.cwd(), '.env.server'))
    },
    firebaseConfig: {
        projectId: process.env.FIREBASE_PROJECT_ID ? '已设置' : '未设置',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '已设置' : '未设置',
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? '已设置(长度:' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : '未设置',
        databaseUrl: process.env.FIREBASE_DATABASE_URL ? '已设置' : '未设置'
    }
});

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
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY;
    const databaseUrl = process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('环境变量加载失败，请检查配置：', {
          PROJECT_ID: !!projectId,
          CLIENT_EMAIL: !!clientEmail,
          PRIVATE_KEY: !!privateKey
      });
      throw new Error('缺少必要的 Firebase 配置');
    }
  } else {
    console.log('跳过 Firebase 配置检查');
  }

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

// 在初始化 Firebase 之前调用验证
validateEnvVariables();

// 环境变量加载诊断函数
const diagnoseEnvLoading = () => {
    console.log('=== 环境变量加载诊断开始 ===');
    
    // 1. 检查 NODE_ENV
    console.log('1. NODE_ENV:', {
        value: process.env.NODE_ENV,
        type: typeof process.env.NODE_ENV
    });

    // 2. 检查当前目录结构
    console.log('2. 目录结构:', {
        currentDir: process.cwd(),
        files: readdirSync(process.cwd()),
        envFiles: readdirSync(process.cwd()).filter(f => f.startsWith('.env'))
    });

    // 3. 检查环境文件内容
    const envPaths = [
        '.env.production',
        '.env.test',
        '.env.server'
    ];

    console.log('3. 环境文件检查:');
    envPaths.forEach(envPath => {
        if (existsSync(envPath)) {
            const content = readFileSync(envPath, 'utf8');
            console.log(`${envPath} 内容预览:`, {
                exists: true,
                length: content.length,
                hasFirebaseConfig: {
                    projectId: content.includes('FIREBASE_PROJECT_ID'),
                    clientEmail: content.includes('FIREBASE_CLIENT_EMAIL'),
                    privateKey: content.includes('FIREBASE_PRIVATE_KEY')
                }
            });
        } else {
            console.log(`${envPath}: 文件不存在`);
        }
    });

    // 4. 检查 Docker 环境变量
    console.log('4. Docker 环境变量:', {
        inContainer: existsSync('/.dockerenv'),
        dockerEnvVars: {
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID?.substring(0, 5) + '...',
            FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 5) + '...',
            FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '存在' : '不存在'
        }
    });

    console.log('=== 环境变量加载诊断结束 ===');
};

// 在配置验证之前调用诊断
diagnoseEnvLoading();

// 预处理环境变量
const preprocessEnvVars = () => {
    if (process.env.FIREBASE_PRIVATE_KEY) {
        // 确保私钥格式正确
        process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY
            .replace(/\\n/g, '\n')
            .replace(/^["']|["']$/g, '');
    }
};

preprocessEnvVars();

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

// 文件系统检查
const checkFileSystem = () => {
    const paths = [
        process.cwd(),
        path.resolve(process.cwd(), '.env.production'),
        path.resolve(process.cwd(), '.env.test'),
        path.resolve(process.cwd(), '.env.server')
    ];

    console.log('文件系统检查:', {
        paths: paths.map(p => ({
            path: p,
            exists: existsSync(p),
            isFile: existsSync(p) && statSync(p).isFile(),
            permissions: existsSync(p) ? statSync(p).mode.toString(8) : null
        })),
        workingDir: {
            contents: readdirSync(process.cwd()),
            path: process.cwd()
        }
    });
};

checkFileSystem();

const validateFirebaseConfig = () => {
    const requiredVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_DATABASE_URL'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('Firebase 配置验证失败:', {
            missing: missingVars,
            environment: process.env.NODE_ENV,
            dockerEnv: existsSync('/.dockerenv'),
            envFiles: {
                production: existsSync('.env.production'),
                test: existsSync('.env.test'),
                server: existsSync('.env.server')
            }
        });
        
        // 检查环境变量值的格式
        requiredVars.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                console.log(`${varName} 格式检查:`, {
                    length: value.length,
                    hasQuotes: value.startsWith('"') || value.startsWith("'"),
                    hasNewlines: value.includes('\\n'),
                    preview: value.substring(0, 10) + '...'
                });
            }
        });
        
        throw new Error(`缺少必要的 Firebase 配置: ${missingVars.join(', ')}`);
    }
};

// 添加文件系统诊断
const diagnoseFileSystem = () => {
    const paths = [
        process.cwd(),
        path.resolve(process.cwd(), '..'),
        path.resolve(process.cwd(), 'config'),
        path.resolve(process.cwd(), 'payment-server')
    ];

    console.log('文件系统诊断:', {
        paths: paths.map(p => ({
            path: p,
            exists: existsSync(p),
            contents: existsSync(p) ? readdirSync(p) : 'not accessible',
            isDirectory: existsSync(p) ? statSync(p).isDirectory() : false
        })),
        envFiles: {
            production: {
                path: path.resolve(process.cwd(), '.env.production'),
                exists: existsSync(path.resolve(process.cwd(), '.env.production')),
                size: existsSync(path.resolve(process.cwd(), '.env.production')) 
                    ? statSync(path.resolve(process.cwd(), '.env.production')).size 
                    : 0
            },
            server: {
                path: path.resolve(process.cwd(), '.env.server'),
                exists: existsSync(path.resolve(process.cwd(), '.env.server')),
                size: existsSync(path.resolve(process.cwd(), '.env.server')) 
                    ? statSync(path.resolve(process.cwd(), '.env.server')).size 
                    : 0
            }
        }
    });
};

// 在配置加载之前进行诊断
diagnoseFileSystem();

export { db, withRetry }; 