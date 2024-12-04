import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4242;

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('错误: 未设置 STRIPE_SECRET_KEY 环境变量');
  process.exit(1);
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

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('支付服务器错误:', err);
  res.status(500).json({
    error: '支付服务出错',
    message: err.message || '未知错误',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(port, () => {
  console.log(`Stripe 测试服务器运行在 http://localhost:${port}`);
});