Payment successful! Thank you for your subscription


当前环境: development
环境文件路径: D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main\.env.development
Stripe密钥配置: true
Webhook密钥配置: true
服务器运行在 http://localhost:4242
服务器健康检查就绪，运行在 http://localhost:4242/health
跑马灯客户端已连接
跑马灯客户端已连接
跑马灯客户端已断开连接
创建支付意向: { amount: 19, currency: 'USD' }
支付意向创建成功: pi_3RLDfRISLzgtB7h603MO7eMP_secret_fkw8fMbPAV6tMYdeNOqCIj9Vk
开始异步处理已验证的 Stripe Webhook 事件: {
  type: 'payment_intent.created',
  id: 'evt_3RLDfRISLzgtB7h60teFgn4P',
  timestamp: '2025-05-05T01:17:59.491Z'
}
未处理的事件类型: payment_intent.created
开始异步处理已验证的 Stripe Webhook 事件: {
  type: 'payment_intent.succeeded',
  id: 'evt_3RLDfRISLzgtB7h60zdsQxJ7',
  timestamp: '2025-05-05T01:18:35.634Z'
}
开始处理支付成功: pi_3RLDfRISLzgtB7h603MO7eMP
尝试执行操作 (1/5)
开始异步处理已验证的 Stripe Webhook 事件: {
  type: 'charge.succeeded',
  id: 'evt_3RLDfRISLzgtB7h60S7rdumh',
  timestamp: '2025-05-05T01:18:35.861Z'
}
未处理的事件类型: charge.succeeded
处理支付失败: TypeError: Cannot read properties of undefined (reading 'status')
    at WebhookService.handlePaymentSuccess (file:///D:/Software/ai_tools/AI_Webbuilder/ai-chat-application-1113-main/server/services/WebhookService.js:13:25)
    at async Immediate.<anonymous> (file:///D:/Software/ai_tools/AI_Webbuilder/ai-chat-application-1113-main/server/index.js:75:13)
异步处理 Webhook 事件失败: {
  error: "Cannot read properties of undefined (reading 'status')",
  stack: "TypeError: Cannot read properties of undefined (reading 'status')\n" +
    '    at WebhookService.handlePaymentSuccess (file:///D:/Software/ai_tools/AI_Webbuilder/ai-chat-application-1113-main/server/services/WebhookService.js:13:25)\n' +
    '    at async Immediate.<anonymous> (file:///D:/Software/ai_tools/AI_Webbuilder/ai-chat-application-1113-main/server/index.js:75:13)',
  eventId: 'evt_3RLDfRISLzgtB7h60zdsQxJ7',
  eventType: 'payment_intent.succeeded'
}



ngrok                                                                                                   (Ctrl+C to quit)                                                                                                                        � Using ngrok for OSS? Request a community license: https://ngrok.com/r/oss                                                                                                                                                                     Session Status                online                                                                                    Account                       king8597@gmail.com (Plan: Free)                                                           Update                        update available (version 3.22.1, Ctrl-U to update)                                       Version                       3.16.0                                                                                    Region                        Asia Pacific (ap)                                                                         Latency                       118ms                                                                                     Web Interface                 http://127.0.0.1:4040                                                                     Forwarding                    https://24b8-103-231-84-131.ngrok-free.app -> http://localhost:4242                                                                                                                                               Connections                   ttl     opn     rt1     rt5     p50     p90                                                                             11      0       0.03    0.01    5.02    6.08                                                                                                                                                                      HTTP Requests                                                                                                           -------------                                                                                                                                                                                                                                   09:18:35.632 CST POST    /webhook/stripe                   200 OK                                                       09:18:35.860 CST POST    /webhook/stripe                   200 OK                                                       09:17:59.485 CST POST    /webhook/stripe                   200 OK                                                       09:17:57.881 CST POST    /api/stripe/create-payment-intent 200 OK                                                       09:17:57.196 CST OPTIONS /api/stripe/create-payment-intent 204 No Content    



Events
Event details
payment_intent.succeeded
Event ID
Origin date
May 5, 2025, 9:18:38 AM
Source
API
View logs
API version
2025-02-24.acacia
Description
The payment pi_3RLDfRISLzgtB7h603MO7eMP for USD 19.00 has succeeded
Deliveries to webhook endpoints
Attempts to send this event to your webhook endpoints in the past 15 days.
All
Succeeded
Failed

200
https://24b8-103-231-84-131.ngrok-free.app/webhook/stripe
May 5, 2025, 9:18:38 AM
Resend
Deliveries to connected platforms
Attempts to send this event to connected platform endpoints in the past 15 days.
All
Succeeded
Failed