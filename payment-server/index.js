import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import webhookService from './services/webhook-service.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'development' 
            ? ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:4242']
            : [process.env.CORS_ORIGIN],
        methods: ["GET", "POST"],
        credentials: true
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
});

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

// CORS 配置
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:4242',
    'https://love.saga4v.com',
    'http://payment:4242',
    'https://payment.saga4v.com'
];

app.use(cors({
    origin: function(origin, callback) {
        console.log('支付服务收到请求，来源:', origin);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error('不允许的来源:', origin);
            callback(new Error('不允许的来源'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Origin', 'Authorization']
}));
app.use(express.json());

app.options('*', cors());

// 请求日志中间件
app.use((req, res, next) => {
    console.log('收到请求:', {
        method: req.method,
        path: req.path,
        origin: req.headers.origin,
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString(),
        protocol: req.protocol,
        secure: req.secure,
        hostname: req.hostname,
        ip: req.ip,
        originalUrl: req.originalUrl,
        corsHeaders: {
            origin: req.headers.origin,
            accessControlRequestMethod: req.headers['access-control-request-method'],
            accessControlRequestHeaders: req.headers['access-control-request-headers']
        }
    });
    next();
});

app.post('/api/stripe/create-payment-intent', async (req, res) => {
    console.log('开始处理支付请求:', {
        body: req.body,
        headers: req.headers,
        timestamp: new Date().toISOString()
    });
    
    try {
        const { amount, currency } = req.body;
        console.log('创建支付意向，参数:', { 
            amount, 
            currency,
            amountInCents: Math.round(amount * 100)
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
        console.error('支付意向创建失败:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            error: '支付服务出错',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 添加 webhook 路由
app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  console.log('收到 Stripe Webhook 请求:', {
    path: req.path,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // 处理 checkout.session.completed 事件
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // 获取客户信息和订阅信息
      const customer = await stripe.customers.retrieve(session.customer);
      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      // 更新用户订阅状态
      await webhookService.handleSubscriptionCreated({
        userId: session.client_reference_id, // 确保在创建支付链接时设置这个值
        email: session.customer_email,
        subscriptionId: session.subscription,
        planId: subscription.items.data[0].price.product,
        duration: subscription.items.data[0].price.recurring.interval,
        status: 'active'
      });
    }

    res.json({received: true});
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// 统一的健康检查路由
app.get('/health', (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            stripe: {
                configured: !!process.env.STRIPE_SECRET_KEY
            }
        };
        console.log('健康检查状态:', healthStatus);
        res.status(200).json(healthStatus);
    } catch (error) {
        console.error('健康检查失败:', error);
        res.status(500).json({ status: 'unhealthy', error: error.message });
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

// WebSocket 事件处理
io.on('connection', (socket) => {
    console.log('客户端连接成功:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('客户端断开连接:', socket.id);
    });
    
    socket.on('error', (error) => {
        console.error('Socket 错误:', error);
    });
});

// 统一使用一个端口配置
const PORT = process.env.SOCKET_PORT || 4242;

// 启动服务器（只保留一个启动调用）
server.listen(PORT, '0.0.0.0', () => {
    console.log(`支付服务器运行在端口 ${PORT}`);
    console.log(`Socket.IO 服务已启动`);
    console.log(`CORS origin: ${process.env.CORS_ORIGIN}`);
});
