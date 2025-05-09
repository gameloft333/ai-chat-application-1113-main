# AI Chat Application: Daily Character Chat Times Limitation Design

## 1. Overview

This document defines the design and rationale for implementing a **daily total chat times limitation** shared across all AI characters, with support for configurable limits, daily reset (server time), and subscription-based overrides. It is intended as a clear, non-duplicated guide for future development, strictly following project dev rules and best practices.

---

## 2. Requirements Summary

- Each user has a daily chat quota (e.g., 10 times) shared across all characters.
- The quota resets to the configured maximum at midnight (00:00) server time (UTC).
- When the quota is exhausted, the user cannot chat with any character until the next day or until they subscribe.
- Subscribers can have a higher daily limit or unlimited chats, both configurable.
- All configuration is managed via `.env` files.
- Usage is tracked in a dedicated database table for auditability and analytics.
- All UI/UX and backend logic must follow i18n, security, and modularity rules.

---

## 3. Configuration

Add the following keys to `.env.example`, `.env.production`, `.env.development`:

```
CHARACTER_CHAT_LIMIT=10
CHARACTER_CHAT_LIMIT_SUBSCRIBER=100  # or 'unlimited'
```
- `CHARACTER_CHAT_LIMIT`: Daily chat times for regular users.
- `CHARACTER_CHAT_LIMIT_SUBSCRIBER`: Daily chat times for subscribers (number or 'unlimited').

Document these in `README.md` under environment/config section.

---

## 4. Database Schema

Create a dedicated table to track daily usage per user:

```sql
CREATE TABLE public.chat_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  date DATE NOT NULL, -- e.g., '2024-06-10'
  used_count INTEGER DEFAULT 0,
  UNIQUE (user_id, date)
);
```
- Each row records a user's chat usage for a specific day.
- Enables analytics, audit, and future extensibility.

---

## 5. Backend Logic

- On each chat request:
  1. Get today's date (server time, UTC).
  2. Query `chat_usage` for the user and today. If no record, create one with `used_count = 0`.
  3. Determine the user's limit:
     - If subscriber: use `CHARACTER_CHAT_LIMIT_SUBSCRIBER` (number or unlimited).
     - Else: use `CHARACTER_CHAT_LIMIT`.
  4. If `used_count < limit`, allow chat and increment `used_count`.
  5. If `used_count >= limit`, block and return an i18n error message.
- On subscription/payment:
  - Update the user's subscription status.
  - Apply the new limit logic immediately.

---

## 6. Frontend/UI Logic

- Display the user's remaining chat times for today: `remaining = limit - used_count`.
- If 0, show a paywall or "come back tomorrow" message.
- If subscriber, show "unlimited" or the higher limit.
- All UI text must use i18next keys (no hardcoded text).

---

## 7. Rationale & Best Practices

- **Security:** All enforcement is backend-side; frontend is for display only.
- **Auditability:** Usage history is preserved for analytics and support.
- **Configurability:** All limits are managed via `.env` and documented.
- **Extensibility:** The schema and logic allow for future features (e.g., bonus times, admin overrides, analytics).
- **Compliance:** Follows all dev rules: no hardcoded keys, i18n, modular code, no logic in UI-only changes, etc.

---

## 8. Files/Modules to Update (for Implementation)

- `.env.example`, `.env.production`, `.env.development` (add config keys)
- `README.md` (document config)
- Supabase migration SQL (add `chat_usage` table)
- Backend chat controller/service (enforce daily, per-user, per-subscription limits)
- Backend payment/subscription logic (update subscription status, apply new limits)
- Frontend UI (display remaining times, paywall, i18n keys)

---

## 9. Open for Future Extension

- Admin UI for manual adjustment/reset
- Bonus times, promotional events
- User-facing usage history
- Advanced analytics and reporting

---

## 10. 细化实现建议

### 10.1 RESTful API接口定义（示例）

#### 1. 获取用户今日剩余聊天次数
- **GET** `/api/chat-usage/today`
- **鉴权**：Bearer Token（JWT，需登录）
- **响应示例：**
```json
{
  "date": "2024-06-10",
  "limit": 10,
  "used": 3,
  "remaining": 7,
  "isSubscriber": false
}
```

#### 2. 发送聊天请求（消耗次数）
- **POST** `/api/chat/send`
- **Body**：
```json
{
  "characterId": "uuid",
  "message": "string"
}
```
- **鉴权**：Bearer Token
- **响应（成功）：**
```json
{
  "success": true,
  "remaining": 6
}
```
- **错误码示例：**
```json
{
  "success": false,
  "error": "chat_limit_exceeded", // i18n key
  "message": "You have reached your daily chat limit."
}
```

#### 3. 管理员重置/调整用户次数（可选）
- **POST** `/api/admin/chat-usage/reset`
- **Body**：
```json
{
  "userId": "uuid",
  "date": "2024-06-10",
  "used": 0
}
```
- **鉴权**：Admin Token

---

### 10.2 SQL迁移脚本（Supabase/Postgres）

```sql
CREATE TABLE public.chat_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  date DATE NOT NULL,
  used_count INTEGER DEFAULT 0,
  UNIQUE (user_id, date)
);

-- 可选：为查询优化添加索引
CREATE INDEX idx_chat_usage_user_date ON public.chat_usage(user_id, date);
```

---

### 10.3 i18n key设计建议

所有与聊天次数相关的提示、错误、按钮等文本，均需使用i18n key，避免硬编码。

**注意：所有i18n键值及翻译内容，必须添加到现有的 `src/config/i18n/zh.ts` 和 `src/config/i18n/en.ts` 文件中，禁止新建独立json文件。**

**推荐key命名：**
- `chat.limit.title`         // 聊天次数标题
- `chat.limit.remaining`     // 剩余次数提示
- `chat.limit.exceeded`      // 超出限制提示
- `chat.limit.subscribe`     // 订阅提示
- `chat.limit.unlimited`     // 无限次数

**zh.ts 示例：**
```typescript
// src/config/i18n/zh.ts
export default {
  // ... 其他内容 ...
  chat: {
    // ... 其他内容 ...
    limit: {
      title: '今日剩余聊天次数',
      remaining: '您今日还可聊天 {{count}} 次',
      exceeded: '您已用完今日所有聊天次数，请订阅以获得更多次数。',
      subscribe: '订阅会员，畅聊无限',
      unlimited: '无限次数'
    }
  }
  // ... 其他内容 ...
}
```

**en.ts 示例：**
```typescript
// src/config/i18n/en.ts
export default {
  // ... other content ...
  chat: {
    // ... other content ...
    limit: {
      title: "Today's Remaining Chat Times",
      remaining: "You have {{count}} chats left today.",
      exceeded: "You have reached your daily chat limit. Subscribe for more.",
      subscribe: "Subscribe for unlimited chats",
      unlimited: "Unlimited"
    }
  }
  // ... other content ...
}
```

**务必将所有新i18n键值集成到上述TypeScript配置文件中，保持项目结构和多语言管理一致性。**

---

### 10.4 最佳实践说明

- **安全性**：所有接口均需鉴权，防止未授权操作。
- **i18n**：所有用户可见文本均用i18n key，支持多语言。
- **RESTful**：接口风格RESTful，状态码、错误码规范。
- **可扩展性**：数据库、接口、i18n key均预留扩展空间。
- **合规性**：严格遵循dev_rule.txt、README、团队开发规范。

---

**本节内容为开发落地的细化建议，供开发者直接参考实现。**

**This document supersedes all previous versions and should be used as the single source of truth for implementing the daily chat times limitation feature.**


