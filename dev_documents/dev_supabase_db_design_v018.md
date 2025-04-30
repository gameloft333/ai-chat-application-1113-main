# Supabase 数据库结构设计文档（v1）

## 一、设计原则与思路

1. 严格遵循团队开发规范（见 dev_rule_v017.md），所有敏感信息不落地，结构最小化、可扩展、可维护。
2. 结合AI多角色聊天、会员、支付、国际化、消息、统计等业务需求，支持多端、未来多产品线扩展。
3. 参考现有表结构和迁移SQL（final_0429_all_in_one_migration_202407.sql），做适配和优化。
4. 兼容Supabase生态，充分利用其认证、RLS、JSONB、触发器、视图等能力。
5. 支持多语言、角色、会员、支付、消息、统计、运营活动等后续扩展。
6. 所有表均需有created_at/updated_at，重要表建议加metadata(JSONB)以便灵活扩展。

---

## 二、核心表结构设计

### 1. 用户与认证

#### users（用户主表，扩展Supabase auth.users）
| 字段名                | 类型         | 说明                       |
|----------------------|-------------|----------------------------|
| id                   | uuid        | 主键，auth.users.id        |
| firebase_uid         | text        | 兼容firebase迁移           |
| email                | text        | 邮箱                       |
| username             | text        | 用户名                     |
| avatar_url           | text        | 头像                       |
| created_at           | timestamptz | 创建时间                   |
| updated_at           | timestamptz | 更新时间                   |
| last_login_at        | timestamptz | 最后登录                   |
| subscription_status  | text        | 会员状态（normal/trial/paid...）|
| subscription_expires_at | timestamptz | 会员到期时间             |
| metadata             | jsonb       | 预留扩展                   |

---

### 2. 角色与扮演

#### characters（AI角色表）
| 字段名        | 类型         | 说明                       |
|--------------|-------------|----------------------------|
| id           | uuid        | 主键                       |
| name         | text        | 角色名                     |
| avatar_url   | text        | 角色头像                   |
| gender       | text        | 性别/类型                  |
| description  | text        | 简要描述                   |
| i18n         | jsonb       | 多语言描述                 |
| is_active    | bool        | 是否启用                   |
| created_at   | timestamptz | 创建时间                   |
| updated_at   | timestamptz | 更新时间                   |
| metadata     | jsonb       | 预留扩展                   |

---

### 3. 聊天与消息

#### conversations（会话表）
| 字段名        | 类型         | 说明                       |
|--------------|-------------|----------------------------|
| id           | uuid        | 主键                       |
| user_id      | uuid        | 所属用户                   |
| title        | text        | 会话标题                   |
| created_at   | timestamptz | 创建时间                   |
| updated_at   | timestamptz | 更新时间                   |
| is_archived  | bool        | 是否归档                   |
| metadata     | jsonb       | 预留扩展                   |

#### messages（消息表）
| 字段名          | 类型         | 说明                       |
|----------------|-------------|----------------------------|
| id             | uuid        | 主键                       |
| conversation_id | uuid        | 所属会话                   |
| user_id        | uuid        | 发送者（用户/AI）          |
| content        | text        | 消息内容                   |
| role           | text        | user/assistant/system      |
| created_at     | timestamptz | 创建时间                   |
| metadata       | jsonb       | 预留扩展                   |

---

### 4. 支付与会员

#### payments（支付记录表）
| 字段名        | 类型         | 说明                       |
|--------------|-------------|----------------------------|
| id           | uuid        | 主键                       |
| user_id      | uuid        | 所属用户                   |
| amount       | numeric     | 金额                       |
| currency     | text        | 币种                       |
| payment_method | text      | stripe/paypal/ton          |
| status       | text        | 状态（pending/success/failed）|
| created_at   | timestamptz | 创建时间                   |
| metadata     | jsonb       | 预留扩展                   |

#### subscriptions（会员订阅表）
| 字段名        | 类型         | 说明                       |
|--------------|-------------|----------------------------|
| id           | uuid        | 主键                       |
| user_id      | uuid        | 所属用户                   |
| plan_id      | text        | 会员套餐                   |
| status       | text        | 状态（active/cancelled/expired）|
| started_at   | timestamptz | 开始时间                   |
| expires_at   | timestamptz | 到期时间                   |
| payment_id   | uuid        | 支付记录id                 |
| metadata     | jsonb       | 预留扩展                   |

---

### 5. 统计与运营

#### character_stats（角色热度统计）
| 字段名        | 类型         | 说明                       |
|--------------|-------------|----------------------------|
| id           | uuid        | 主键                       |
| character_id | uuid        | 角色id                     |
| chat_count   | int         | 聊天次数                   |
| last_chat_at | timestamptz | 最后一次聊天               |
| metadata     | jsonb       | 预留扩展                   |

#### marquee_messages（跑马灯/公告）
| 字段名        | 类型         | 说明                       |
|--------------|-------------|----------------------------|
| id           | uuid        | 主键                       |
| content      | text        | 公告内容                   |
| is_active    | bool        | 是否启用                   |
| created_at   | timestamptz | 创建时间                   |
| metadata     | jsonb       | 预留扩展                   |

---

### 6. 反馈与运营活动

#### feedback（用户反馈）
| 字段名        | 类型         | 说明                       |
|--------------|-------------|----------------------------|
| id           | uuid        | 主键                       |
| user_id      | uuid        | 用户id                     |
| email        | text        | 邮箱                       |
| rating       | int         | 评分1-5                    |
| comment      | text        | 反馈内容                   |
| created_at   | timestamptz | 创建时间                   |
| updated_at   | timestamptz | 更新时间                   |

#### share_rewards（分享奖励）
| 字段名        | 类型         | 说明                       |
|--------------|-------------|----------------------------|
| id           | uuid        | 主键                       |
| user_id      | uuid        | 用户id                     |
| platform     | text        | 平台（如wechat、twitter）  |
| date         | date        | 日期                       |
| count        | int         | 当天分享次数               |
| last_share_time | timestamptz | 最后分享时间             |
| created_at   | timestamptz | 创建时间                   |

---

### 7. 多语言与配置

#### locales（多语言资源表，建议用文件+缓存为主，表仅做动态扩展）
| 字段名        | 类型         | 说明                       |
|--------------|-------------|----------------------------|
| id           | uuid        | 主键                       |
| lang         | text        | 语言代码                   |
| key          | text        | 多语言key                  |
| value        | text        | 文本内容                   |
| updated_at   | timestamptz | 更新时间                   |

#### system_settings（系统配置）
| 字段名        | 类型         | 说明                       |
|--------------|-------------|----------------------------|
| id           | uuid        | 主键                       |
| key          | text        | 配置项key                  |
| value        | jsonb       | 配置内容                   |
| created_at   | timestamptz | 创建时间                   |
| updated_at   | timestamptz | 更新时间                   |

---

## 三、RLS与安全策略建议

- 所有表启用RLS，默认仅允许用户操作自己的数据，管理员可全表操作。
- 重要表（如users、payments、subscriptions、messages）建议加视图和API专用策略，便于前端安全调用。
- metadata字段统一用jsonb，便于后续无损扩展。
- 所有表建议加created_at/updated_at，部分表加is_active软删除。

---

## 四、扩展建议

- 积分系统：可加points、points_history表，支持签到、任务、消费等积分运营。
- 运营活动：如签到、抽奖、广告、任务等，可单独建表，便于灵活扩展。
- AI模型/Prompt管理：如需支持多模型、多Prompt，可加ai_models、prompts表。
- API日志/审计：建议加api_logs表，便于安全审计和问题追踪。

---

## 五、ER图（简化版）

```
users --< conversations --< messages
users --< payments --< subscriptions
users --< feedback
users --< share_rewards
characters --< character_stats
```

---

## 六、迁移与落地建议

1. 先用Supabase SQL Editor建表，逐步迁移数据，可用final_0429_all_in_one_migration_202407.sql做参考。
2. 用Supabase Auth做用户主控，users表做业务扩展，用触发器同步。
3. 所有API调用均通过RLS安全校验，避免越权。
4. 如需多端/多产品线，建议加app_id、platform等字段做隔离。

---

如需详细SQL建表语句、RLS策略、触发器样例、ER图源文件、API接口建议等，请随时补充需求！ 