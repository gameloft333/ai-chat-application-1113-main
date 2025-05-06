import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import { generateRandomColor } from './utils/color-generator.js';
import WebhookService from './services/WebhookService.js';
import { fileURLToPath } from 'url';

// --- Add Firebase Admin and Supabase --- 
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
// --- End Add --- 

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
const port = process.env.SERVER_PORT || 4242;

console.log('当前环境:', process.env.NODE_ENV);
console.log('环境文件路径:', envPath);
console.log('Stripe密钥配置:', !!process.env.STRIPE_SECRET_KEY);
console.log('Webhook密钥配置:', !!process.env.STRIPE_WEBHOOK_SECRET);
// Add console log for the intended Stripe Webhook URL
console.log('Stripe Webhook URL:', process.env.VITE_STRIPE_WEBHOOK_URL || '未配置');

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
    ? ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:4242', 'http://localhost:4242']
    : [process.env.CORS_ORIGIN],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the signature *before* responding
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // Ensure this matches the Stripe Dashboard secret
    );

    // Signature verified, send 200 OK response
    res.json({ received: true });

    // Asynchronously handle the verified event
    setImmediate(async () => {
      console.log('开始异步处理已验证的 Stripe Webhook 事件:', {
        type: event.type,
        id: event.id,
        timestamp: new Date().toISOString()
      });
      try {
        switch (event.type) {
          case 'payment_intent.succeeded':
            await WebhookService.handlePaymentSuccess(event.data.object);
            break;
          case 'checkout.session.completed':
            const session = event.data.object;
            await WebhookService.handleCheckoutCompleted(session);
            break;
          // Add other event types as needed
          default:
            console.log(`未处理的事件类型: ${event.type}`);
        }
      } catch (err) {
        console.error('异步处理 Webhook 事件失败:', {
          error: err.message,
          stack: err.stack,
          eventId: event.id,
          eventType: event.type
        });
        // Optional: Add to a retry queue or log more persistently
      }
    });

  } catch (err) {
    // Signature verification failed
    console.error('Webhook 签名验证失败:', {
      error: err.message,
      headers: req.headers, // Log headers for debugging signature issues
      timestamp: new Date().toISOString()
    });
    // Send a 400 Bad Request response to Stripe
    res.status(400).send(`Webhook Error: ${err.message}`);
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

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: port
  });
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
  connectTimeout: 45000,
  debug: true,
  logger: {
    debug: (...args) => console.log('DEBUG:', ...args),
    info: (...args) => console.log('INFO:', ...args),
    error: (...args) => console.log('ERROR:', ...args)
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

// 在服务器启动后记录健康状态
server.on('listening', () => {
  console.log(`服务器健康检查就绪，运行在 http://localhost:${port}/health`);
});

// --- Initialize Supabase Admin Client --- 
const supabaseUrl = process.env.PROJECT_URL;
const supabaseServiceKey = process.env.FUNC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in environment variables!');
}

// Create a single instance of the Supabase client for the server
// IMPORTANT: Use the Service Role Key here for admin privileges
// Remove non-null assertions for JS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); 
console.log('Supabase Admin Client initialized (or attempted).');
// --- End Supabase Admin Init --- 

// --- Add API Route for User Sync --- 
app.post('/api/sync-user', async (req, res) => {
    console.log('[API /api/sync-user] Received request');
    const { idToken } = req.body;

    if (!idToken) {
        console.error('[API /api/sync-user] Missing idToken');
        return res.status(400).json({ error: 'Missing idToken' });
    }

    try {
        // 1. Verify Firebase ID Token
        console.log('[API /api/sync-user] Verifying Firebase token...');
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decodedToken.uid;
        const email = decodedToken.email;
        const displayName = decodedToken.name;
        const photoURL = decodedToken.picture;
        console.log(`[API /api/sync-user] Token verified for Firebase UID: ${firebaseUid}`);

        // 2. Check if user exists in public.users by firebase_uid
        console.log(`[API /api/sync-user] Checking Supabase public.users for firebase_uid: ${firebaseUid}`);
        const { data: existingPublicUser, error: selectError } = await supabaseAdmin
            .from('users')
            .select('*') // Select all columns needed for update/return
            .eq('firebase_uid', firebaseUid)
            .maybeSingle();

        if (selectError) {
            console.error('[API /api/sync-user] Error selecting user by firebase_uid:', selectError);
            throw selectError;
        }

        let finalSupabaseProfile = null;

        // 3. User Exists in public.users by firebase_uid - Update
        if (existingPublicUser) {
            console.log(`[API /api/sync-user] Found existing user by firebase_uid (${existingPublicUser.id}). Updating...`);
            const updateData = {
                last_login_at: new Date().toISOString(),
                email: email || existingPublicUser.email, // Update email if provided, otherwise keep existing
                // Only update username/avatar if provided in token, otherwise keep existing
                ...(displayName && { username: displayName }),
                ...(photoURL && { avatar_url: photoURL }),
                // Add any other fields you want to update on login
            };

            const { data: updatedUser, error: updateError } = await supabaseAdmin
                .from('users')
                .update(updateData)
                .eq('firebase_uid', firebaseUid) // Match by firebase_uid for safety
                .select('*')
                .single();

            if (updateError) {
                console.error(`[API /api/sync-user] Error updating user with firebase_uid ${firebaseUid}:`, updateError);
                throw updateError;
            }
            finalSupabaseProfile = updatedUser;
            console.log(`[API /api/sync-user] User ${updatedUser?.id} updated successfully.`);

        } else {
            // 4. User Does Not Exist in public.users by firebase_uid - Insert new record
            console.log(`[API /api/sync-user] User with firebase_uid ${firebaseUid} not found in public.users. Proceeding to insert.`);

            // 4a. Find or Create user in Supabase Auth by email to get the Supabase User ID
            console.log(`[API /api/sync-user] Checking auth.users for email: ${email}`);
            const { data: { users: authUsers }, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
                filter: `email = "${email}"`, // Ensure email is quoted
                limit: 1
            });

            if (authListError && authListError.message !== "No users found matching the provided criteria.") {
                 console.error('[API /api/sync-user] Error searching Supabase auth users by email:', authListError);
                 throw new Error('Failed to check Supabase auth users.');
            }

            let supabaseAuthUserId = null;
            let isNewSupabaseAuthUser = false;

            if (authUsers && authUsers.length > 0) {
                supabaseAuthUserId = authUsers[0].id;
                console.log(`[API /api/sync-user] Found existing Supabase auth user by email: ${supabaseAuthUserId}`);
            } else {
                // 4b. User doesn't exist in Supabase Auth - Create them
                console.log(`[API /api/sync-user] No Supabase auth user found for email ${email}. Creating...`);
                const { data: { user: newAuthUser }, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    // Optionally set email_confirm based on Firebase verification status or your policy
                    // email_confirm: decodedToken.email_verified || false,
                });

                if (createAuthError) {
                    console.error('[API /api/sync-user] Error creating Supabase auth user:', createAuthError);
                    // Check for specific errors, e.g., email already exists but wasn't found by listUsers (rare)
                    throw createAuthError;
                }
                supabaseAuthUserId = newAuthUser.id;
                isNewSupabaseAuthUser = true;
                console.log(`[API /api/sync-user] Created new Supabase auth user: ${supabaseAuthUserId}`);
            }

            // 4c. Now Insert into public.users using the determined supabaseAuthUserId and firebaseUid
            console.log(`[API /api/sync-user] Inserting into public.users for Supabase ID: ${supabaseAuthUserId} and Firebase UID: ${firebaseUid}`);
            const insertData = {
                id: supabaseAuthUserId, // This MUST match the id in auth.users
                firebase_uid: firebaseUid, // This is the key identifier from Firebase
                email: email, // Email from Firebase token
                username: displayName || email?.split('@')[0] || `user_${firebaseUid.substring(0, 6)}`, // Generate a username if needed
                avatar_url: photoURL, // Avatar from Firebase token
                created_at: new Date().toISOString(), // Set creation time
                last_login_at: new Date().toISOString(), // Set last login time
                subscription_status: 'normal', // Default status, adjust as needed
                subscription_expires_at: null,
                metadata: { provider: 'firebase' } // Indicate the source
            };

            const { data: insertedUser, error: insertError } = await supabaseAdmin
                .from('users')
                .insert(insertData)
                .select('*') // Select the newly inserted row
                .single(); // Expect a single row back

            if (insertError) {
                console.error('[API /api/sync-user] Error inserting into public.users:', insertError);
                // Handle potential race conditions or other errors (e.g., if unique constraint on firebase_uid exists and somehow failed the initial check)
                 if (insertError.code === '23505') { // Unique constraint violation
                    console.warn(`[API /api/sync-user] Insert failed due to unique constraint (code: 23505). User with firebase_uid ${firebaseUid} might have been created concurrently. Attempting to fetch...`);
                    // Attempt to fetch the user again as it might exist now
                    const { data: concurrentUser, error: fetchError } = await supabaseAdmin
                        .from('users')
                        .select('*')
                        .eq('firebase_uid', firebaseUid)
                        .single();
                    if (fetchError) {
                        console.error(`[API /api/sync-user] Error fetching user after unique constraint violation:`, fetchError);
                        throw insertError; // Re-throw original error if fetch fails
                    }
                    finalSupabaseProfile = concurrentUser;
                    console.log(`[API /api/sync-user] Fetched concurrently created user: ${finalSupabaseProfile?.id}`);
                } else {
                    throw insertError; // Throw other insert errors
                }
            } else {
                finalSupabaseProfile = insertedUser;
                console.log(`[API /api/sync-user] User ${insertedUser?.id} inserted into public.users successfully.`);
            }
        }

        // 5. Return the final profile (either updated or newly inserted/fetched)
        if (!finalSupabaseProfile) {
            // This should ideally not happen if error handling is correct
            console.error('[API /api/sync-user] Failed to obtain final user profile.');
            return res.status(500).json({ error: 'Internal server error processing user sync' });
        }
        res.status(200).json(finalSupabaseProfile);

    } catch (error) {
        console.error('[API /api/sync-user] Error processing sync request:', { 
            message: error.message, 
            stack: error.stack, 
            code: error.code, 
            details: error.details 
        });
        // Return a more specific error code if possible (e.g., 401 for invalid token)
        const statusCode = (error.message.includes('verifyIdToken') || error.code?.includes('auth')) ? 401 : 500;
        res.status(statusCode).json({ error: 'Failed to sync user', details: error.message });
    }
});
// --- End API Route --- 