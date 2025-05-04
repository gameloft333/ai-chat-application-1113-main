选择支付方式: stripe
SubscriptionPlans.tsx:203 调用订阅函数，参数: {planId: 'premium', duration: '24months', method: 'stripe'}
App.tsx:248 订阅参数: {planId: 'premium', duration: '24months', paymentMethod: 'stripe'}
App.tsx:342 开始 Stripe 支付流程...
logger.ts:40 [2025-05-04T09:25:52.138Z] [INFO] 初始化Stripe服务 undefined
logger.ts:40 [2025-05-04T09:25:52.141Z] [INFO] Stripe服务初始化完成 {mode: 'test'}
App.tsx:349 创建支付意向，参数: {price: 35, currency: 'USD', originalPrice: 35, minRequired: {…}}
logger.ts:40 [2025-05-04T09:25:52.141Z] [INFO] Starting payment intent creation {amount: 35, currency: 'USD'}
OnlineStats.tsx:63 正在查询Firebase用户数...
OnlineStats.tsx:66 Firebase用户数查询成功: 0
OnlineStats.tsx:110 在线人数计算: {Firebase用户数: 0, 基础人数: 31071, 时间系数: 0.41022225211327945, Firebase加成: 0, 最终人数: 12746}
client:736 
            
            
           GET https://localhost/ net::ERR_CONNECTION_REFUSED
ping @ client:736
waitForSuccessfulPing @ client:755Understand this error
logger.ts:40 [2025-05-04T09:25:54.230Z] [INFO] Payment intent created successfully {clientSecretProvided: true}
logger.ts:52 [2025-05-04T09:25:55.026Z] [ERROR] 创建支付记录失败: 
error @ logger.ts:52
createPaymentRecord @ payment-record-service.ts:32
await in createPaymentRecord
handleSubscribe @ App.tsx:384
await in handleSubscribe
handlePaymentSelect @ SubscriptionPlans.tsx:209
onClick @ SubscriptionPlans.tsx:401
callCallback2 @ chunk-YZVM2MHU.js?v=a2f48ee2:3674
invokeGuardedCallbackDev @ chunk-YZVM2MHU.js?v=a2f48ee2:3699
invokeGuardedCallback @ chunk-YZVM2MHU.js?v=a2f48ee2:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-YZVM2MHU.js?v=a2f48ee2:3736
executeDispatch @ chunk-YZVM2MHU.js?v=a2f48ee2:7014
processDispatchQueueItemsInOrder @ chunk-YZVM2MHU.js?v=a2f48ee2:7034
processDispatchQueue @ chunk-YZVM2MHU.js?v=a2f48ee2:7043
dispatchEventsForPlugins @ chunk-YZVM2MHU.js?v=a2f48ee2:7051
(anonymous) @ chunk-YZVM2MHU.js?v=a2f48ee2:7174
batchedUpdates$1 @ chunk-YZVM2MHU.js?v=a2f48ee2:18913
batchedUpdates @ chunk-YZVM2MHU.js?v=a2f48ee2:3579
dispatchEventForPluginEventSystem @ chunk-YZVM2MHU.js?v=a2f48ee2:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-YZVM2MHU.js?v=a2f48ee2:5478
dispatchEvent @ chunk-YZVM2MHU.js?v=a2f48ee2:5472
dispatchDiscreteEvent @ chunk-YZVM2MHU.js?v=a2f48ee2:5449Understand this error
App.tsx:404 Stripe 支付初始化失败: {error: FirebaseError: Missing or insufficient permissions., stack: 'FirebaseError: Missing or insufficient permissions.', type: 'object'}
handleSubscribe @ App.tsx:404
await in handleSubscribe
handlePaymentSelect @ SubscriptionPlans.tsx:209
onClick @ SubscriptionPlans.tsx:401
callCallback2 @ chunk-YZVM2MHU.js?v=a2f48ee2:3674
invokeGuardedCallbackDev @ chunk-YZVM2MHU.js?v=a2f48ee2:3699
invokeGuardedCallback @ chunk-YZVM2MHU.js?v=a2f48ee2:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-YZVM2MHU.js?v=a2f48ee2:3736
executeDispatch @ chunk-YZVM2MHU.js?v=a2f48ee2:7014
processDispatchQueueItemsInOrder @ chunk-YZVM2MHU.js?v=a2f48ee2:7034
processDispatchQueue @ chunk-YZVM2MHU.js?v=a2f48ee2:7043
dispatchEventsForPlugins @ chunk-YZVM2MHU.js?v=a2f48ee2:7051
(anonymous) @ chunk-YZVM2MHU.js?v=a2f48ee2:7174
batchedUpdates$1 @ chunk-YZVM2MHU.js?v=a2f48ee2:18913
batchedUpdates @ chunk-YZVM2MHU.js?v=a2f48ee2:3579
dispatchEventForPluginEventSystem @ chunk-YZVM2MHU.js?v=a2f48ee2:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-YZVM2MHU.js?v=a2f48ee2:5478
dispatchEvent @ chunk-YZVM2MHU.js?v=a2f48ee2:5472
dispatchDiscreteEvent @ chunk-YZVM2MHU.js?v=a2f48ee2:5449Understand this error


An error occurred during payment processing. Please try again or contact support.

Missing or insufficient permissions.

支付服务器运行在 http://localhost:4242
环境: development
Stripe配置状态: { secretKey: true, webhookSecret: true, localWebhookSecret: true }
收到请求，来源: http://localhost:4173
收到创建支付意向请求: {
  body: {
    amount: 35,
    currency: 'USD',
    userId: '6Sq00HchcqRyk2ETEph5WlLZwDn2',
    timestamp: 1746350752142,
    origin: 'http://localhost:4173'
  },
  headers: {
    host: 'c1d0-223-70-246-60.ngrok-free.app',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'content-length': '129',
    accept: 'application/json',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
    authorization: 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjNmOWEwNTBkYzRhZTgyOGMyODcxYzMyNTYzYzk5ZDUwMjc3ODRiZTUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiSmFtZXMgS2luZyIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLdVQ4aXdUQXZpX0hQYWZLeTE2Q3BFWHNRMjBIaVF1UUpkTGJHaUY3cXhqajQzVXc9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbHVuYS1nYW1lcy00NDUxMDgiLCJhdWQiOiJsdW5hLWdhbWVzLTQ0NTEwOCIsImF1dGhfdGltZSI6MTc0NjM0OTMzNiwidXNlcl9pZCI6IjZTcTAwSGNoY3FSeWsyRVRFcGg1V2xMWndEbjIiLCJzdWIiOiI2U3EwMEhjaGNxUnlrMkVURXBoNVdsTFp3RG4yIiwiaWF0IjoxNzQ2MzQ5MzM2LCJleHAiOjE3NDYzNTI5MzYsImVtYWlsIjoia2luZzg1OTdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTAwMTQ0NTU3OTU4NDg2NzQ1MDciXSwiZW1haWwiOlsia2luZzg1OTdAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.lQ9ASINk3yFeVVnbH1juv0K8zuGVgP7hY5z6YEURKI75FCOMjpv0j0712qthPuPPXO9_ONjUvLB7rgTHnpv11CrxPRCz7BaP9UW0m2QARZEpohAUGmgWjn8xbs5HHdTK-Rt_hcVg2-skdf2_qjKWzIq-SzTNPqvc9Ipt0QKSYZv-pDwDDwDl0IR4h2PuC-58LhOfRwAN5koxM9ZgyDy9EKi-B0V8L4XUpbL9w5nxseYsM7xa1jQTVu5v0dOSSZntMnd5IweiodEUCtyvwQUPPsMf2cZa9dKwh6GHC4cXqpJ1s_Bx_HkYVZGTHg0f3zMfBLDW5o64x0q7MsrPtM459g',
    'content-type': 'application/json',
    origin: 'http://localhost:4173',
    priority: 'u=1, i',
    referer: 'http://localhost:4173/',
    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-storage-access': 'active',
    'x-forwarded-for': '103.147.45.125',
    'x-forwarded-host': 'c1d0-223-70-246-60.ngrok-free.app',
    'x-forwarded-proto': 'https',
    'x-requested-with': 'XMLHttpRequest'
  }
}
支付意向创建成功: { id: 'pi_3RKyo2ISLzgtB7h60iCsaCdz', amount: 3500, currency: 'usd' }
收到请求，来源: undefined
未处理的 Promise 拒绝: ReferenceError: log is not defined
    at file:///D:/Software/ai_tools/AI_Webbuilder/ai-chat-application-1113-main/payment-server/index.js:92:3
    at Layer.handle [as handle_request] (D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main\node_modules\express\lib\router\layer.js:95:5)
    at next (D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main\node_modules\express\lib\router\route.js:149:13)
    at D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main\node_modules\body-parser\lib\read.js:137:5
    at AsyncResource.runInAsyncScope (node:async_hooks:206:9)
    at invokeCallback (D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main\node_modules\raw-body\index.js:238:16)
    at done (D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main\node_modules\raw-body\index.js:227:7)
    at IncomingMessage.onEnd (D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main\node_modules\raw-body\index.js:287:7)
    at IncomingMessage.emit (node:events:518:28)
    at endReadableNT (node:internal/streams/readable:1696:12)


    ngrok                                                                                                         (Ctrl+C to quit)                                                                                                                              ❤️️   ngrok? We're hiring https://ngrok.com/careers                                                                                                                                                                                                          Session Status                online                                                                                          Account                       king8597@gmail.com (Plan: Free)                                                                 Update                        update available (version 3.22.1, Ctrl-U to update)                                             Version                       3.16.0                                                                                          Region                        Japan (jp)                                                                                      Latency                       101ms                                                                                           Latency                       115ms                                                                                           Web Interface                 http://127.0.0.1:4040                                                                           Forwarding                    https://c1d0-223-70-246-60.ngrok-free.app -> http://localhost:4242                                                                                                                                                            Connections                   ttl     opn     rt1     rt5     p50     p90                                                                                   54      0       0.01    0.01    5.03    13.40                                                                                                                                                                                 HTTP Requests                                                                                                                 -------------                                                                                                                                                                                                                                               17:25:54.527 CST POST    /webhook/stripe                                                                                      17:25:53.082 CST POST    /api/stripe/create-payment-intent 200 OK   


    Events
Event details
payment_intent.created
Event ID
Origin date
May 4, 2025, 5:26:16 PM
Source
API
View logs
API version
2025-02-24.acacia
Description
A new payment pi_3RKyo2ISLzgtB7h60iCsaCdz for USD 35.00 was created
Deliveries to webhook endpoints
Attempts to send this event to your webhook endpoints in the past 15 days.
Failed

https://c1d0-223-70-246-60.ngrok-free.app/webhook/stripe
Next retry in in 59 minutes
Resend