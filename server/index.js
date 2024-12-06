import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';

// 根据环境加载对应的环境变量文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.test';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const app = express();
const port = process.env.PORT || 4242;

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('未设置 STRIPE_SECRET_KEY 环境变量');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// console.log('服务器运行模式:', process.env.NODE_ENV);
// console.log('Stripe模式:', process.env.VITE_STRIPE_MODE);

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
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:4242'],
    methods: ['GET', 'POST'],
    credentials: true
  }
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
    shadowColor: '#4299e1'
  },
  {
    id: 2,
    content: {
      zh: '新用户注册即可获得优惠券！',
      en: 'New users get special discounts!'
    },
    type: 'promotion',
    priority: 2,
    shadowColor: '#48bb78'
  }
];

// 生成随机颜色
function getRandomColor() {
  const colors = [
    '#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#ed64a6',
    '#667eea', '#38b2ac', '#f56565', '#ecc94b', '#4fd1c5'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 跑马灯 WebSocket 处理
io.on('connection', (socket) => {
  console.log('跑马灯客户端已连接');
  
  // 立即发送现有消息
  socket.emit('marquee:update', marqueeMessages);
  
  // 每5秒重新发送一次消息，确保循环播放
  const messageInterval = setInterval(() => {
    const updatedMessages = marqueeMessages.map(msg => ({
      ...msg,
      shadowColor: process.env.VITE_MARQUEE_RANDOM_COLORS === 'true' 
        ? getRandomColor() 
        : msg.shadowColor
    }));
    socket.emit('marquee:update', updatedMessages);
    console.log('发送跑马灯消息:', updatedMessages);
  }, Number(process.env.VITE_MARQUEE_REFRESH_INTERVAL) || 5000);

  socket.on('disconnect', () => {
    console.log('跑马灯客户端已断开连接');
    clearInterval(messageInterval);
  });
});

// 修改监听部分
server.listen(port, () => {
  console.log(`服务器运行模式: ${process.env.NODE_ENV}`);
  console.log(`Stripe模式: ${process.env.VITE_STRIPE_MODE}`);
  console.log(`跑马灯服务状态: ${process.env.VITE_MARQUEE_ENABLED === 'true' ? '已启用' : '未启用'}`);
  console.log(`服务器运行在 http://localhost:${port}`);
});