import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4242;

// 添加错误处理中间件
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('未处理的 Promise 拒绝:', err);
});

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('警告: 未设置 STRIPE_SECRET_KEY 环境变量，使用测试模式');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:4242'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Origin']
}));
app.use(express.json());

app.options('*', cors());

app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    console.log('创建支付意向，详细信息:', { 
      amount, 
      currency,
      amountInCents: Math.round(amount * 100),
      timestamp: new Date().toISOString()
    });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
    });

    console.log('支付意向创建成功:', {
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      id: paymentIntent.id
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('创建支付意向失败:', error);
    res.status(500).json({ 
      error: '支付服务出错',
      details: error.message 
    });
  }
});

app.get('/health', (req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stripe: {
            configured: !!process.env.STRIPE_SECRET_KEY,
            mode: process.env.VITE_STRIPE_MODE
        }
    };
    console.log('健康检查:', healthStatus);
    res.status(200).json(healthStatus);
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('支付服务器错误:', err);
  res.status(500).json({
    error: '支付服务出错',
    message: err.message || '未知错误',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Stripe 服务器运行在 http://0.0.0.0:${port}`);
});
