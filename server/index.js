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
import { getOrCreateChatUsage, incrementChatUsage, getUserSubscriptionStatus } from './services/chatUsageService.js';

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
    const { amount, currency, userId } = req.body;
    console.log('创建支付意向:', { amount, currency });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: {
        userId: userId || '', // Pass the Firebase UID to metadata
      }
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

// Middleware to verify Firebase ID token from Authorization header
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[AuthMiddleware] No Bearer token found in Authorization header.');
        return res.status(401).json({ error: 'Unauthorized', message: 'No token provided.' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
        console.warn('[AuthMiddleware] Bearer token is empty.');
        return res.status(401).json({ error: 'Unauthorized', message: 'Malformed token.' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Attach user info (includes uid, email etc.) to request object
        // console.log(`[AuthMiddleware] Token verified for UID: ${decodedToken.uid}`);
        next();
    } catch (error) {
        console.error('[AuthMiddleware] Error verifying Firebase ID token:', error.message);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Unauthorized', message: 'Token expired.', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token.' });
    }
};

export { supabaseAdmin };

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
            // 4. User Does Not Exist in public.users by firebase_uid - Attempt Insert
            console.log(`[API /api/sync-user] User with firebase_uid ${firebaseUid} not found in public.users. Proceeding.`);

            // 4a. Find Supabase Auth User ID by email
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
            let requiresNewAuthUser = false; // Flag to force creation

            if (authUsers && authUsers.length > 0) {
                const potentialAuthUserId = authUsers[0].id;
                console.log(`[API /api/sync-user] Found potential Supabase auth user by email: ${potentialAuthUserId}`);

                // <<<<------ CHECK FOR INCONSISTENCY ------>>>>
                console.log(`[API /api/sync-user] Verifying if public.users ID ${potentialAuthUserId} is already linked correctly...`);
                const { data: conflictingPublicUser, error: conflictCheckError } = await supabaseAdmin
                    .from('users')
                    .select('id, firebase_uid, email')
                    .eq('id', potentialAuthUserId)
                    .maybeSingle();

                if (conflictCheckError) {
                    console.error(`[API /api/sync-user] Error checking for conflicting public user ID ${potentialAuthUserId}:`, conflictCheckError);
                    throw new Error('Failed to verify user consistency.');
                }

                if (conflictingPublicUser) {
                    if (conflictingPublicUser.firebase_uid !== firebaseUid) {
                        // DATA INCONSISTENCY DETECTED!
                        console.warn(`[API /api/sync-user] DATA INCONSISTENCY DETECTED!`);
                        console.warn(`  Supabase Auth ID ${potentialAuthUserId} (found via email ${email}) is linked in public.users to different Firebase UID: ${conflictingPublicUser.firebase_uid}`);
                        console.warn(`  Forcing creation of a new Supabase Auth user for Firebase UID: ${firebaseUid}`);
                        requiresNewAuthUser = true; // Set the flag
                    } else {
                        // ID and Firebase UID match - user already synced.
                        console.log(`[API /api/sync-user] Found matching public user via Supabase ID ${potentialAuthUserId}. User already synced.`);
                        finalSupabaseProfile = conflictingPublicUser; // Assign the found profile
                        supabaseAuthUserId = potentialAuthUserId; // Assign the ID
                    }
                } else {
                  // No public.users record found for this Auth ID.
                  // Safe to link the new Firebase user to this existing Supabase Auth ID.
                  console.log(`[API /api/sync-user] No conflicting public user found for ID ${potentialAuthUserId}. Proceeding to link.`);
                  supabaseAuthUserId = potentialAuthUserId; // Assign the ID
                }
                // <<<<------ END CHECK ------>>>>

            } else {
                // No Supabase auth user found by email at all.
                 requiresNewAuthUser = true;
            }

            // 4b. Create new Supabase Auth user if needed
            if (requiresNewAuthUser) {
                 console.log(`[API /api/sync-user] Creating new Supabase auth user for email ${email}...`);
                const { data: { user: newAuthUser }, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    // email_confirm: decodedToken.email_verified || false, // Optional
                });

                if (createAuthError) {
                    console.error('[API /api/sync-user] Error creating Supabase auth user:', createAuthError);
                    // Handle specific errors like email already existing if needed
                    throw createAuthError;
                }
                supabaseAuthUserId = newAuthUser.id; // Get the *new* ID
                isNewSupabaseAuthUser = true;
                console.log(`[API /api/sync-user] Created new Supabase auth user: ${supabaseAuthUserId}`);
                 finalSupabaseProfile = null; // Ensure we proceed to insert in public.users
            }

            // 4c. Insert into public.users if no complete profile was assigned yet
            if (!finalSupabaseProfile && supabaseAuthUserId) {
                console.log(`[API /api/sync-user] Inserting into public.users for Supabase ID: ${supabaseAuthUserId} and Firebase UID: ${firebaseUid}`);
                const insertData = {
                    id: supabaseAuthUserId, 
                    firebase_uid: firebaseUid,
                    email: email, 
                    username: displayName || email?.split('@')[0] || `user_${firebaseUid.substring(0, 6)}`, 
                    avatar_url: photoURL,
                    created_at: new Date().toISOString(),
                    last_login_at: new Date().toISOString(),
                    subscription_status: 'normal',
                    subscription_expires_at: null,
                    metadata: { provider: 'firebase' }
                };

                const { data: insertedUser, error: insertError } = await supabaseAdmin
                    .from('users')
                    .insert(insertData)
                    .select('*')
                    .single();

                if (insertError) {
                    console.error('[API /api/sync-user] Error inserting into public.users:', insertError);
                    // Original error handling for insert (e.g., 23505 on firebase_uid constraint if added later)
                    if (insertError.code === '23505') { 
                        // Check if it's the firebase_uid constraint or the primary key constraint
                         if (insertError.message.includes('users_firebase_uid_key')) {
                             console.warn(`[API /api/sync-user] Insert failed due to unique firebase_uid constraint (code: 23505). User ${firebaseUid} might have been created concurrently.`);
                             // Attempt to fetch the user again
                             const { data: concurrentUser, error: fetchError } = await supabaseAdmin.from('users').select('*').eq('firebase_uid', firebaseUid).single();
                             if (fetchError) {
                                 console.error(`[API /api/sync-user] Error fetching user after firebase_uid unique constraint violation:`, fetchError);
                                 throw insertError;
                             }
                             finalSupabaseProfile = concurrentUser;
                         } else if (insertError.message.includes('users_pkey')) {
                            console.error(`[API /api/sync-user] Insert failed due to primary key conflict (code: 23505) for ID ${supabaseAuthUserId}. This indicates a severe data inconsistency.`);
                             // We already checked for this, but handle defensively
                              return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to insert user due to persistent data conflict.' });
                         } else {
                              throw insertError; // Re-throw other unique constraint errors
                         }
                    } else {
                        throw insertError; // Throw other insert errors
                    }
                } else {
                    finalSupabaseProfile = insertedUser;
                    console.log(`[API /api/sync-user] User ${insertedUser?.id} inserted into public.users successfully.`);
                }
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

// API Endpoint to get today's chat usage
app.get('/api/chat-usage/today', authenticateUser, async (req, res) => {
    const firebaseUid = req.user.uid; // Firebase UID
    const todayUTC = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in UTC

    try {
        // Fetch Supabase user ID (UUID) using firebase_uid
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id') // Select the Supabase UUID primary key
            .eq('firebase_uid', firebaseUid)
            .single();

        if (profileError || !userProfile) {
            console.error(`[API /api/chat-usage/today] User profile not found for firebase_uid ${firebaseUid}:`, profileError);
            return res.status(404).json({ error: 'User profile not found in Supabase.' });
        }
        const supabaseUserId = userProfile.id; // This is the Supabase UUID

        const [usage, subscription] = await Promise.all([
            getOrCreateChatUsage(supabaseUserId, todayUTC), // Use Supabase UUID
            getUserSubscriptionStatus(supabaseUserId)     // Use Supabase UUID
        ]);

        if (!usage) {
            // This case should ideally be handled within getOrCreateChatUsage by throwing an error
            console.error(`[API /api/chat-usage/today] Failed to get or create usage record for user: ${supabaseUserId}`);
            return res.status(500).json({ error: 'Failed to retrieve chat usage.' });
        }

        const currentStatus = subscription?.subscription_status;
        const isSubscriber = currentStatus &&
                             currentStatus.toLowerCase() !== 'normal' &&
                             (subscription.subscription_expires_at ? new Date(subscription.subscription_expires_at) > new Date() : true);
        
        let limit;
        if (isSubscriber) {
            const subLimit = process.env.CHARACTER_CHAT_LIMIT_SUBSCRIBER;
            if (subLimit && subLimit.toLowerCase() === 'unlimited') {
                limit = Infinity;
            } else {
                limit = parseInt(subLimit, 10) || 100; // Default to 100 if parsing fails or not set
            }
        } else {
            limit = parseInt(process.env.CHARACTER_CHAT_LIMIT, 10) || 10; // Default to 10
        }

        const remaining = limit === Infinity ? Infinity : Math.max(0, limit - usage.used_count);

        // Added detailed logging before sending the response
        console.log(`[API /api/chat-usage/today] Final calculation for firebase_uid ${firebaseUid} (Supabase ID ${supabaseUserId}): `,
            JSON.stringify({
                fetchedUsage: usage,
                fetchedSubscription: subscription,
                calculatedIsSubscriber: !!isSubscriber,
                calculatedLimit: limit === Infinity ? 'unlimited' : limit,
                calculatedRemaining: remaining === Infinity ? 'unlimited' : remaining,
                envCharacterChatLimit: process.env.CHARACTER_CHAT_LIMIT,
                envSubscriberChatLimit: process.env.CHARACTER_CHAT_LIMIT_SUBSCRIBER
            }, null, 2)
        );

        res.json({
            date: todayUTC,
            limit: limit === Infinity ? 'unlimited' : limit,
            used: usage.used_count,
            remaining: remaining === Infinity ? 'unlimited' : remaining,
            isSubscriber: !!isSubscriber // Ensure boolean
        });

    } catch (error) {
        console.error(`[API /api/chat-usage/today] Error for firebase_uid ${firebaseUid} (Supabase ID ${supabaseUserId || 'unknown'}):`, error);
        res.status(500).json({ error: 'Internal server error while fetching chat usage.', details: error.message });
    }
});

// API Endpoint to increment chat usage for the day
app.post('/api/chat-usage/increment', authenticateUser, async (req, res) => {
    const firebaseUid = req.user.uid; // Firebase UID
    const todayUTC = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in UTC
    let supabaseUserId = null; // For logging in case of early error

    try {
        // Fetch Supabase user ID (UUID) using firebase_uid
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();

        if (profileError || !userProfile) {
            console.error(`[API /api/chat-usage/increment] User profile not found for firebase_uid ${firebaseUid}:`, profileError);
            return res.status(404).json({ error: 'User profile not found in Supabase.' });
        }
        supabaseUserId = userProfile.id; // This is the Supabase UUID

        // First, check if the user is allowed to chat (idempotency for increment)
        const [usage, subscription] = await Promise.all([
            getOrCreateChatUsage(supabaseUserId, todayUTC), // Use Supabase UUID
            getUserSubscriptionStatus(supabaseUserId)     // Use Supabase UUID
        ]);

        if (!usage) {
            console.error(`[API /api/chat-usage/increment] Failed to get or create usage record for user: ${supabaseUserId} before increment.`);
            return res.status(500).json({ error: 'Failed to retrieve chat usage before increment.' });
        }

        const currentStatus = subscription?.subscription_status;
        const isSubscriber = currentStatus &&
                             currentStatus.toLowerCase() !== 'normal' &&
                             (subscription.subscription_expires_at ? new Date(subscription.subscription_expires_at) > new Date() : true);

        let limit;
        if (isSubscriber) {
            const subLimit = process.env.CHARACTER_CHAT_LIMIT_SUBSCRIBER;
            if (subLimit && subLimit.toLowerCase() === 'unlimited') {
                limit = Infinity;
            } else {
                limit = parseInt(subLimit, 10) || 100;
            }
        } else {
            limit = parseInt(process.env.CHARACTER_CHAT_LIMIT, 10) || 10;
        }

        if (limit !== Infinity && usage.used_count >= limit) {
            console.warn(`[API /api/chat-usage/increment] User ${firebaseUid} attempted to increment chat usage beyond limit.`);
            return res.status(403).json({ 
                error: 'chat.limit.exceeded', // For i18n on client
                message: 'Chat limit exceeded for today.',
                currentUsage: {
                    date: todayUTC,
                    limit: limit,
                    used: usage.used_count,
                    remaining: 0,
                    isSubscriber: !!isSubscriber
                }
            });
        }

        // If allowed, then increment
        const updatedUsage = await incrementChatUsage(supabaseUserId, todayUTC); // Use Supabase UUID
        const newRemaining = limit === Infinity ? Infinity : Math.max(0, limit - updatedUsage.used_count);

        res.json({
            success: true,
            message: 'Chat usage incremented.',
            updatedUsage: {
                date: todayUTC,
                limit: limit === Infinity ? 'unlimited' : limit,
                used: updatedUsage.used_count,
                remaining: newRemaining === Infinity ? 'unlimited' : newRemaining,
                isSubscriber: !!isSubscriber
            }
        });

    } catch (error) {
        console.error(`[API /api/chat-usage/increment] Error for firebase_uid ${firebaseUid} (Supabase ID ${supabaseUserId || 'unknown'}):`, error);
        res.status(500).json({ error: 'Internal server error while incrementing chat usage.', details: error.message });
    }
});

// --- End API Route --- 