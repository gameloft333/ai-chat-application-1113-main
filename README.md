# AI Chat Application 1113

## 项目简介

本项目是一个多角色、多语言、支持多种支付方式的 AI 聊天应用，集成了丰富的会员体系、角色扮演、实时消息、语音合成、支付订阅等功能。

**核心架构**: 采用 **Firebase** 进行用户认证（邮箱、Google登录），并使用 **Supabase** 作为主要的数据存储后端（用户信息、聊天记录、订阅等）。通过 Node.js 后端服务实现 Firebase 用户到 Supabase 数据库的安全同步。

前后端分离，支持多端部署，适合快速扩展和二次开发。

---

## 目录结构

```
├── src/                   # 前端主代码
│   ├── api/               # API 封装
│   ├── components/        # 复用型UI组件（Material Design/HIG风格）
│   ├── config/            # 配置文件（如支付、主题、会员等）
│   ├── contexts/          # React Contexts（如多语言、认证、主题等）
│   ├── controllers/       # 控制器逻辑
│   ├── data/              # 静态/动态数据
│   ├── locales/           # 多语言资源（i18next管理）
│   ├── pages/             # 页面级组件
│   ├── repositories/      # 数据仓库
│   ├── scripts/           # 脚本工具
│   ├── services/          # 业务服务层
│   ├── store/             # 状态管理
│   ├── styles/            # 样式（Material Design/HIG/自定义）
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   └── main.tsx           # 前端入口
├── server/                # Node.js后端服务
│   ├── config/            # 后端配置
│   ├── services/          # 后端服务
│   ├── utils/             # 后端工具
│   └── index.js           # 后端入口
├── payment-server/        # 支付相关服务
├── ton-payment/           # TON支付相关服务
├── public/                # 静态资源
├── scripts/               # 自动化脚本
├── dev_documents/         # 开发文档
├── .env*                  # 环境变量配置
├── package.json           # 依赖与脚本
├── dev_rule.txt.txt       # 团队开发规范
├── README.md              # 项目说明文档
└── ...                    # 其他配置与部署文件
```

---

## 技术栈

### 前端
- **React 18** + **TypeScript**
- **Vite**（极速开发与构建）
- **Ant Design 5.x**（部分UI）
- **Tailwind CSS**（自定义样式/Material Design风格）
- **react-router-dom**（路由管理）
- **react-i18next/i18next**（多语言国际化）
- **react-hook-form**（表单管理）
- **axios**（网络请求）
- **react-query**（数据请求与缓存）
- **socket.io-client**（实时通信）
- **Stripe/PayPal/Ton**（多支付集成）
- **eslint/prettier**（代码规范）

### 后端
- **Node.js** + **Express**
- **Firebase Authentication** (用户认证)
- **Firebase Admin SDK** (Token 验证)
- **Supabase** (数据库 Postgres + Auth 用户管理)
- **@supabase/supabase-js** (Supabase 客户端)
- **socket.io**（实时通信）
- **dotenv**（环境变量管理）
- **stripe/paypal/ton**（支付服务）
- **TypeScript/JavaScript**（后端服务）

### 数据库
- **Supabase Postgres** (主要数据存储)
- **Firebase Firestore** (部分用户配置或历史数据，如 `userProfiles`)

### 脚本与自动化
- **run-commit.bat**（自动提交与推送）
- **Docker/Docker Compose**（容器化部署）
- **Nodemon/TSX**（开发热重载）

---

## 数据库结构

项目主要使用 **Supabase (Postgres)** 作为后端数据库服务，**Firebase Firestore** 用于部分辅助数据。Supabase 提供了完整的数据模型设计。

### 核心表 (Supabase)
- **users (public)**：用户信息表，扩展自 Supabase **auth.users** (通过 `id` 关联)。包含 `firebase_uid` 用于关联 Firebase 认证用户。
- **characters (public)**：AI角色定义表。
- **conversations (public)**：用户与AI的对话会话表。
- **messages (public)**：对话中的消息内容表。

### 支付与会员相关表 (Supabase)
- **payments**：支付记录表，记录所有交易
- **subscriptions**：订阅管理表，记录用户订阅计划、状态、到期时间等
- **share_rewards**：分享奖励记录表

### 系统与配置相关表 (Supabase)
- **system_settings**：系统设置表，全局配置项
- **marquee_messages**：系统公告表
- **locales**：动态多语言文本（可选，主要使用文件式多语言）
- **feedback**：用户反馈表
- **character_stats**：角色使用统计表

### 辅助表 (Firestore)
- **userProfiles**: 用于存储一些客户端直接读写的用户配置或历史数据。

### 数据关系 (Supabase)
- 用户(auth.users) -> 用户资料(public.users) (通过 id)
- 用户资料(public.users) -> 会话(conversations)
- 会话(conversations) -> 消息(messages)
- 角色(characters) → 消息(messages)
- 用户(users) → 支付(payments) → 订阅(subscriptions)
- 角色(characters) → 统计(character_stats)

### 安全策略 (Supabase)
- 所有 `public` 模式下的表均启用行级安全策略 (RLS)。
- `public.users` 表策略允许用户读写自己的记录。
- 其他表策略通常基于 `auth.uid()` 检查关联记录的所有权。
- 后端服务 (`server/index.js`) 使用 **Service Role Key** 操作数据库，绕过 RLS 进行用户同步等管理任务。

详细的数据库结构请参考 `supabase/migrations/` 目录下的 SQL 文件。

---

## 美术风格与UX

- **Material Design** 与 **Human Interface Guidelines (HIG)** 结合，兼容深色/浅色主题。
- 组件风格统一，按钮、卡片、输入框等均遵循现代设计规范。
- 响应式布局，适配PC与移动端。
- 角色头像、会员等级、支付流程等均有清晰的视觉分层。
- 支持动态主题色、动画效果（如聊天气泡、加载动画等）。
- 颜色生成遵循可访问性（WCAG）标准，确保对比度与可读性。

---

## 多语言与国际化

- 使用 **i18next** 和 **react-i18next** 管理所有文本，支持中英文等多语言切换。
- 多语言资源文件位于 `src/locales/`，新增语言只需扩展对应json文件。
- 所有UI文本均通过多语言key调用，严禁硬编码。

---

## 环境与配置

- 所有敏感key、API地址、数据库凭证等均存储于 `.env` 文件。
- 支持多环境（开发、测试、生产），分别对应 `.env.development`、`.env.test`、`.env.production`。
- **前端所需 Supabase 配置:**
  - `VITE_SUPABASE_URL`: Supabase 项目 URL。
  - `VITE_SUPABASE_ANON_KEY`: Supabase 公共 Anon Key。
  - `CHARACTER_CHAT_LIMIT`: 普通用户每日聊天次数上限 (例如: 10)。
  - `CHARACTER_CHAT_LIMIT_SUBSCRIBER`: 订阅用户每日聊天次数上限 (例如: 100, 或 'unlimited' 表示无限制)。
- **后端所需 Firebase/Supabase 配置:**
  - Firebase Admin SDK 凭证 (e.g., `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)。
  - `PROJECT_URL`: Supabase 项目 URL (与 `VITE_SUPABASE_URL` 值相同)。
  - `FUNC_SUPABASE_SERVICE_ROLE_KEY`: Supabase **Service Role Key** (高度机密)。
- 新增配置项需同步更新 `.env.example` 及相关文档。

---

## 主要功能模块

- **用户认证**：邮箱/Google登录 (Firebase Auth)，用户数据同步至 Supabase。
- **用户数据存储**: 主要用户信息、聊天记录、订阅状态等存储于 Supabase。
- **后端同步服务**: Node.js 后端提供 `/api/sync-user` 端点，安全地将 Firebase 用户同步到 Supabase Auth 和 `public.users` 表。
- **角色扮演**：多角色选择，支持自定义与多语言描述。
- **AI聊天**：支持多轮对话、上下文记忆、语音合成。
- **会员体系**：多级会员订阅，支持多种支付方式，自动管理到期与续费。
- **支付系统**：集成Stripe、PayPal、Ton等，支持多币种。
- **实时消息**：基于socket.io，支持在线状态、系统公告等。
- **多语言支持**：全站国际化，支持动态切换。
- **主题切换**：深色/浅色模式，动态主题色。
- **数据统计**：角色热度、用户活跃度、订阅数据等。
- **错误边界与日志**：全局错误捕获，详细debug日志，便于定位问题。

---

## 开发规范与流程

- **严格遵循 `dev_rule.txt.txt` 团队开发规范**，包括但不限于：
  - 关键配置全部.env管理，禁止明文key
  - 新功能模块化、最小单元开发，已测代码不随意更改
  - UI优化仅限显示层，不得影响逻辑与配置
  - 多语言、路由、表单、网络请求等均用指定库
  - 代码提交、推送、版本号、文档需同步更新
  - 新文件/功能需在README和相关文档详细说明
  - 遇到问题优先debug日志定位，避免盲目修改
  - 严禁随意删除文件、配置、注释
  - 颜色、UI需兼顾可访问性与主题适配
  - 详见 `dev_rule.txt.txt` 文件

---

## 快速上手

### 环境准备

1. **克隆项目**
   ```bash
   git clone <项目地址>
   cd ai-chat-application-1113-main
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   - 复制 `.env.example` 为 `.env.development`、`.env.production`、`.env.test`，并根据实际情况填写。

4. **本地开发启动**
   ```bash
   npm run dev
   # 或分别启动前后端
   npm run dev:server
   npm run dev
   ```

5. **自动提交与推送**
   ```bash
   scripts/run-commit.bat
   ```

6. **构建与部署**
   ```bash
   npm run build
   # 生产环境部署见 Dockerfile/docker-compose
   ```

---

## 角色分工建议

- **产品经理**：关注功能模块、用户流程、会员体系、支付逻辑、国际化需求，参与需求文档与验收。
- **前端开发**：负责UI组件、页面开发、状态管理、国际化、主题适配、与后端API对接。
- **后端开发**：负责API接口、支付集成、用户与会员管理、数据存储、socket服务。
- **全栈开发**：可独立负责端到端功能开发，需熟悉前后端技术栈与部署流程。
- **美术UI/UX**：负责界面设计、交互优化、图标与角色美术、可访问性与响应式设计。
- **测试工程师**：负责功能测试、接口测试、UI自动化、兼容性与安全性测试。

---

## 参考与扩展

- 详细开发规则见 `dev_rule.txt.txt`
- 变更日志见 `CHANGELOG.md`
- 角色设计参考 `ai_character_design_v01.xlsx`
- 具体API、服务、组件说明请查阅 `src/` 目录下各模块及注释

## 部署与Nginx代理修复说明（2025-05-08）

- 修复了生产环境下 love.saga4v.com 访问502 Bad Gateway的问题。
- 主要原因：Nginx全局代理配置（saga4v-nginx）与前端容器Nginx端口、CORS头、OPTIONS预检处理等存在冲突。
- 解决方案：
  - 确认全局Nginx的 `proxy_pass` 指向前端容器的正确端口（4173）。
  - 临时简化了 `location /` 代理配置，去除多余CORS和OPTIONS处理，恢复正常访问。
  - 建议如需CORS或自定义header，逐步引入并测试。
- 相关配置文件：
  - `nginx.global.250128.conf`（主配置，已修正）
  - `nginx-custom.conf`（前端容器Nginx，已显式日志）
  - `nginx/default.conf`（如未被include可删除）