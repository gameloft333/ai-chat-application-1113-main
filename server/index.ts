import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();
const port = 3000;

// 使用测试模式的 Secret Key
const stripe = new Stripe('sk_test_your_stripe_secret_key', {
  apiVersion: '2023-10-16'
});

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'X-Requested-With']
}));

// 添加预检请求处理
app.options('*', cors());

app.use(express.json());

app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe 使用最小货币单位（如分）
      currency: currency.toLowerCase(),
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('创建支付意向失败:', error);
    res.status(500).json({ error: '支付服务出错' });
  }
});

app.listen(port, () => {
  console.log(`Stripe 测试服务器运行在 http://localhost:${port}`);
});