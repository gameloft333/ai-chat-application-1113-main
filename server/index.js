import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import { generateRandomColor } from './utils/color-generator.js';
import WebhookService from './services/WebhookService.js';

// 根据 NODE_ENV 加载对应的环境变量文件
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production'
  : process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env.development';

// 加载环境变量
const envPath = path.resolve(process.cwd(), envFile);
dotenv.config({ path: envPath });

const app = express();
const port = process.env.PORT || 4242;

console.log('当前环境:', process.env.NODE_ENV);
console.log('环境文件路径:', envPath);
console.log('Stripe密钥配置:', !!process.env.STRIPE_SECRET_KEY);
console.log('Webhook密钥配置:', !!process.env.STRIPE_WEBHOOK_SECRET);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('未设置 STRIPE_SECRET_KEY 环境变量');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10'
});

// console.log('服务器运行模式:', process.env.NODE_ENV);
// console.log('Stripe模式:', process.env.VITE_STRIPE_MODE);

app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:4242']
    : [process.env.CORS_ORIGIN],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  // 立即响应 Stripe，避免超时
  const response = { received: true };
  res.json(response);
  
  // 异步处理 webhook 事件
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log('开始异步处理 Stripe Webhook 事件:', {
      type: event.type,
      id: event.id,
      timestamp: new Date().toISOString()
    });

    // 异步处理不同类型的事件
    setImmediate(async () => {
      try {
        switch (event.type) {
          case 'payment_intent.succeeded':
            await WebhookService.handlePaymentSuccess(event.data.object);
            break;
          case 'checkout.session.completed':
            const session = event.data.object;
            await WebhookService.handleCheckoutCompleted(session);
            break;
        }
      } catch (err) {
        console.error('异步处理 Webhook 事件失败:', err);
        // 记录错误到日志系统
      }
    });
  } catch (err) {
    console.error('Webhook 签名验证失败:', err.message);
  }
});

app.use(express.json());

app.options('*', cors());

app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    console.log('创建支付意向:', { amount, currency });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
    });

    console.log('支付意向创建成功:', paymentIntent.client_secret);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('创建支付意向失败:', error);
    res.status(500).json({ 
      error: '支付服务出错',
      details: error.message 
    });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  path: process.env.VITE_WEBSOCKET_PATH || '/socket.io',
  cors: {
    origin: process.env.NODE_ENV === 'development' 
      ? ['http://localhost:5173', 'http://localhost:4173']
      : [process.env.CORS_ORIGIN],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket'],
  pingTimeout: Number(process.env.VITE_SOCKET_TIMEOUT) || 60000,
  pingInterval: 25000,
  connectTimeout: 45000
});

// 跑马灯消息存储
const marqueeMessages = [
  {
    id: 1,
    content: {
      zh: '欢迎来到我们的平台！',
      en: 'Welcome to our platform!'
    },
    type: 'info',
    priority: 1,
    shadowColor: generateRandomColor(),
    textColor: generateRandomColor()
  },
  {
    id: 2,
    content: {
      zh: '新用户注册即可获得优惠券！',
      en: 'New users get special discounts!'
    },
    type: 'promotion',
    priority: 2,
    shadowColor: generateRandomColor(),
    textColor: generateRandomColor()
  },
  {
    id: 3,
    content: {
      zh: '注意: 现在处于测试模式，服务器重启时会清空聊天记录哦。',
      en: 'Note: We are currently in test mode, and chat records will be cleared when the server restarts.'
    },
    type: 'warning',
    priority: 3,
    shadowColor: generateRandomColor(),
    textColor: generateRandomColor()
  }
];

// 跑马灯 WebSocket 处理
io.on('connection', (socket) => {
  console.log('跑马灯客户端已连接');
  socket.emit('marquee:update', marqueeMessages);
  
  const messageInterval = setInterval(() => {
    socket.emit('marquee:update', marqueeMessages);
  }, Number(process.env.VITE_MARQUEE_REFRESH_INTERVAL) || 5000);

  socket.on('disconnect', () => {
    console.log('跑马灯客户端已断开连接');
    clearInterval(messageInterval);
  });
});

// 错误处理
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO连接错误:', err);
});

server.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});