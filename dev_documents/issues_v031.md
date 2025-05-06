当前环境: development
环境文件路径: D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main\.env.development
Stripe密钥配置: true
Webhook密钥配置: true
Stripe Webhook URL: https://18dc-103-97-2-51.ngrok-free.app/webhook/stripe
Supabase Admin Client initialized (or attempted).
服务器运行在 http://localhost:4242
服务器健康检查就绪，运行在 http://localhost:4242/health
跑马灯客户端已连接
跑马灯客户端已断开连接
跑马灯客户端已连接
[API /api/sync-user] Received request
[API /api/sync-user] Verifying Firebase token...
[API /api/sync-user] Token verified for Firebase UID: xaTDM9wHeIWB4ZnSyxZdVSSYcP22
[API /api/sync-user] Checking Supabase public.users for firebase_uid: xaTDM9wHeIWB4ZnSyxZdVSSYcP22
[API /api/sync-user] Found existing user by firebase_uid (57c14345-ca25-4448-aa17-657d389cc035). Updating...
[API /api/sync-user] User 57c14345-ca25-4448-aa17-657d389cc035 updated successfully.
创建支付意向: { amount: 25, currency: 'USD' }
支付意向创建成功: pi_3RLkQTISLzgtB7h60ScARb6F_secret_7MO7dipmNqE5BFSZ8wwA0fr1M
开始异步处理已验证的 Stripe Webhook 事件: {
  type: 'payment_intent.created',
  id: 'evt_3RLkQTISLzgtB7h60yZ8uruJ',
  timestamp: '2025-05-06T12:16:44.330Z'
}
未处理的事件类型: payment_intent.created
开始异步处理已验证的 Stripe Webhook 事件: {
  type: 'payment_intent.succeeded',
  id: 'evt_3RLkQTISLzgtB7h60nOoMmir',
  timestamp: '2025-05-06T12:17:13.613Z'
}
[WebhookService] 开始处理支付成功: pi_3RLkQTISLzgtB7h60ScARb6F
尝试执行操作 (1/5)
开始异步处理已验证的 Stripe Webhook 事件: {
  type: 'charge.succeeded',
  id: 'evt_3RLkQTISLzgtB7h60J4wJlEL',
  timestamp: '2025-05-06T12:17:13.843Z'
}
未处理的事件类型: charge.succeeded
[WebhookService] Firebase paymentRecord updated: {
  id: 'PDWw4AwFY47164Y5IgoA',
  uid: 'xaTDM9wHeIWB4ZnSyxZdVSSYcP22',
  userEmail: 'test121@test.com',
  planId: 'pro',
  duration: '24months',
  orderId: 'pi_3RLkQTISLzgtB7h60ScARb6F',
  amount: 25,
  currency: 'USD',
  status: 'completed',
  createdAt: '2025-05-06T12:17:13.193Z',
  expiredAt: '2027-05-06T12:17:13.193Z',
  paymentChannel: 'stripe',
  paymentAccount: 'test121@test.com',
  completedAt: '2025-05-06T12:17:15.541Z',
  userId: null,
  updatedAt: '2025-05-06T12:17:15.541Z'
}
[WebhookService] Firebase UID (userId) missing in paymentIntent metadata. Skipping Firebase user update and Supabase sync.