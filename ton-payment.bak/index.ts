import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TonClient } from '@ton/ton';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保在最开始就加载环境变量
dotenv.config({
  path: resolve(__dirname, '..', process.env.NODE_ENV === 'production' 
    ? '.env.production'
    : process.env.NODE_ENV === 'test' 
      ? '.env.test' 
      : '.env')
});

const app = express();
const port = process.env.TON_SERVER_PORT || 4243;

// 根据环境确定需要验证的环境变量
const getRequiredEnvVars = (env: string) => {
  const commonVars = [
    'NODE_ENV',
    'TON_USD_RATE',
    'TON_RATE_BUFFER'
  ];

  const envSpecificVars = {
    test: [
      'VITE_TON_API_KEY',
      'TON_NETWORK',
      'VITE_TON_TEST_WALLET_ADDRESS'
    ],
    production: [
      'TON_API_KEY',
      'TON_NETWORK',
      'VITE_TON_WALLET_ADDRESS'
    ]
  };

  return [...commonVars, ...(envSpecificVars[env] || [])];
};

// 统一钱包地址的获取逻辑
const getWalletAddress = () => {
  const currentEnv = process.env.NODE_ENV;
  // 优先使用带 VITE_ 前缀的环境变量
  const walletAddress = currentEnv === 'production'
    ? (process.env.VITE_TON_WALLET_ADDRESS || process.env.TON_WALLET_ADDRESS)
    : (process.env.VITE_TON_TEST_WALLET_ADDRESS || process.env.TON_TEST_WALLET_ADDRESS);
  
  if (!walletAddress) {
    console.warn(`警告: ${currentEnv}环境的钱包地址未配置`);
  }
  return walletAddress;
};

// 验证环境变量并输出配置信息
const validateEnvConfig = () => {
  const currentEnv = process.env.NODE_ENV;
  const envFile = `.env.${currentEnv}`;
  
  console.log('=== TON 支付服务初始化 ===');
  
  const requiredEnvVars = getRequiredEnvVars(currentEnv);
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    console.error('错误: 以下环境变量未设置:');
    missingVars.forEach(envVar => {
      console.error(`- ${envVar}`);
    });
    console.log(`请在 ${envFile} 文件中配置所有必要的环境变量`);
    return false;
  }

  // 验证数值类型的配置
  const numericConfigs = {
    TON_USD_RATE: Number(process.env.TON_USD_RATE),
    TON_RATE_BUFFER: Number(process.env.TON_RATE_BUFFER)
  };

  for (const [key, value] of Object.entries(numericConfigs)) {
    if (isNaN(value)) {
      console.error(`错误: ${key} 必须是有效的数字`);
      return false;
    }
  }

  // 获取钱包地址
  const walletAddress = getWalletAddress();
  
  console.log('服务配置:', {
    环境: currentEnv,
    网络: process.env.TON_NETWORK,
    钱包地址: walletAddress,
    服务地址: `http://localhost:${port}`,
    汇率配置: {
      USD汇率: process.env.TON_USD_RATE,
      价格缓冲: process.env.TON_RATE_BUFFER
    }
  });

  return true;
};

// 在应用启动时进行验证
if (!validateEnvConfig()) {
  process.exit(1);
}

console.log('TON 服务器运行模式:', process.env.NODE_ENV);
console.log('TON 网络:', process.env.TON_NETWORK);
// console.log(`TON 支付服务运行在 http://localhost:${port}`);

// 初始化 TON 客户端配置
const getTonClientConfig = () => {
  const isTestnet = process.env.TON_NETWORK === 'testnet';
  const endpoint = isTestnet 
    ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
    : 'https://toncenter.com/api/v2/jsonRPC';
    
  return {
    endpoint,
    apiKey: process.env.TON_API_KEY,
    testnet: isTestnet
  };
};

// 初始化 TON 客户端
const tonClient = new TonClient(getTonClientConfig());

interface PaymentRequest {
  amount: number;
  currency: string;
}

interface PaymentResponse {
  paymentId: string;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  originalAmount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
}

// 临时存储支付信息（实际项目中应该使用数据库）
const paymentStore = new Map<string, Payment>();

// 存储支付信息
async function savePaymentInfo(payment: Payment): Promise<void> {
  paymentStore.set(payment.id, payment);
  console.log('保存支付信息:', payment);
}

// 获取支付信息
async function getPaymentInfo(paymentId: string): Promise<Payment | null> {
  const payment = paymentStore.get(paymentId);
  console.log('获取支付信息:', { paymentId, payment });
  return payment || null;
}

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Accept', 'Origin']
}));

app.use(express.json());

// 从环境变量读取 TON 汇率配置
const TON_USD_RATE = Number(process.env.TON_USD_RATE) || 5;
const TON_RATE_BUFFER = Number(process.env.TON_RATE_BUFFER) || 1.05;

/*if (!TON_WALLET_ADDRESS) {
  console.error('TON钱包地址未配置，环境:', process.env.NODE_ENV);
}*/

// 创建支付
app.post('/api/ton/create-payment', async (req: Request<{}, {}, PaymentRequest>, res: Response) => {
  try {
    const { amount, currency } = req.body;
    console.log('创建 TON 支付:', { amount, currency });
    
    if (!amount || !currency) {
      throw new Error('缺少必要参数');
    }

    // 确保计算正确的 TON 量（确保至少保留 2 位小数）
    const tonAmount = Number(((amount / TON_USD_RATE) * TON_RATE_BUFFER).toFixed(2));
    console.log('计算的 TON 数���:', { amount, TON_USD_RATE, TON_RATE_BUFFER, tonAmount });
    
    const paymentId = `TON_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payment: Payment = {
      id: paymentId,
      amount: tonAmount,
      originalAmount: amount,
      currency,
      status: 'pending',
      createdAt: new Date()
    };

    // 保存支付信息
    await savePaymentInfo(payment);
    console.log('支付信息已保存:', payment);

    const walletAddress = getWalletAddress();
    if (!walletAddress) {
      throw new Error('钱包地址未配置');
    }

    res.json({ 
      paymentId: payment.id,
      status: payment.status,
      tonAmount: tonAmount.toFixed(2),
      walletAddress,
      deepLink: `ton://transfer/${walletAddress}?amount=${tonAmount}&text=Payment_${payment.id}`
    });
  } catch (error) {
    console.error('创建 TON 支付失败:', error);
    res.status(500).json({ 
      error: '创建 TON 支付失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 检查支付状态
app.get('/api/ton/check-payment/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    console.log('检查支付状态:', paymentId);

    // 从存储中获取支付信息（这里需要实现存储逻辑）
    const payment = await getPaymentInfo(paymentId);
    
    if (!payment) {
      throw new Error('支付信息不存在');
    }

    res.json({
      status: payment.status,
      paymentId: payment.id,
      walletAddress: process.env.VITE_TON_TEST_WALLET_ADDRESS,
      tonAmount: payment.amount.toFixed(2),
      originalAmount: payment.originalAmount.toFixed(2),
      deepLink: `ton://transfer/${process.env.VITE_TON_TEST_WALLET_ADDRESS}?amount=${payment.amount.toFixed(2)}&text=Payment_${payment.id}`
    });
  } catch (error: unknown) {
    console.error('检查支付状态失败:', error);
    res.status(500).json({ 
      error: '检查支付状态失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '支付服务出错',
    message: err.message
  });
});

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: '未找到请求的资源',
    path: req.path
  });
});

app.listen(port, () => {
  console.log(`TON 支付服务运行在 http://localhost:${port}`);
}); 