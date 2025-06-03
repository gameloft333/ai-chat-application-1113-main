# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - YYYY-MM-DD

### Changed
- `OnlineStats` 组件优化：未登录（游客）用户访问时，将跳过 Firebase 注册用户数查询，仅显示在线人数和峰值，避免无权限报错。登录用户则完整显示注册用户数参与的统计。

### Fixed
- 修复游客访问时因无 Firebase 权限导致的 403 报错和控制台警告。

## [1.286.705.27516] - 2025-05-05 

### Added
- Integrated Supabase for user data persistence (user profiles, conversations, etc.) alongside Firebase Authentication.
- Created backend API endpoint (`/api/sync-user` in `server/index.js`) to handle secure synchronization of Firebase authenticated users to Supabase (`auth.users` and `public.users`).

### Changed
- Refactored authentication flow (`AuthContext.tsx`) to call the backend sync API instead of client-side Supabase calls or Edge Functions.
- Updated Supabase schema (`public.users`) to include `firebase_uid` for linking.
- Added necessary environment variables for backend Supabase (Service Role Key) and Firebase Admin SDK configuration.
- Updated Node.js server (`server/index.js`) dependencies (`firebase-admin`, `@supabase/supabase-js`) and initialization logic.

### Removed
- Removed unused Supabase Edge Function files (`sync-firebase-user`, `_shared/cors.ts`).
- Removed unused client-side `userService.ts`.

### Fixed
- Resolved persistent errors related to creating users in Supabase by switching to a backend-driven synchronization approach.

## [0.19.3] - 2024-04-03

### Added
- Added voice support for AI characters. Users can now choose to receive responses as text, voice, or both.
- Implemented a voice synthesis service to handle text-to-speech functionality.

### Changed
- Updated ChatInterface to handle different response modes based on configuration.

## [0.16.0] - 2024-03-31

### Changed
- Removed occupation-based prompt files from the prompts folder
- Updated CharacterSelector to use character names from nameDatabase
- Modified character configurations to use new prompt file names

## [0.15.0] - 2024-03-30

### Changed
- Updated character names to use the nameDatabase instead of role names
- Renamed prompt files to match character IDs (e.g., bertha.txt instead of doctor.txt)
- Updated CharacterSelector component to use the new naming scheme
- Modified llm-config.ts to use character IDs instead of roles

### Fixed
- Resolved issue with loading character prompts

## [0.14.0] - 2024-03-29

### Added
- Implemented name database with 100 female names
- Updated CharacterSelector to use names from the database for character display
- Re-enabled Zhipu API support

### Changed
- Modified character images to use specific URLs instead of dynamic Unsplash URLs
- Updated prompt loading to use character IDs instead of names
- Refactored CharacterSelector component for better readability and maintainability
- Updated llm-config.ts to randomly select available LLMs for each character

### Fixed
- Resolved issue with loading character prompts
- Fixed error handling in llm-service.ts

## [0.13.0] - 2024-03-28

### Added
- Implemented name database with 100 female names
- Updated CharacterSelector to use names from the database for character display

### Changed
- Modified character images to use specific URLs instead of dynamic Unsplash URLs
- Updated prompt loading to use character IDs instead of names
- Refactored CharacterSelector component for better readability and maintainability

### Fixed
- Resolved issue with loading character prompts

## [0.12.0] - 2024-03-27

### Changed
- Re-enabled Zhipu API in .env file
- Updated application name to "AI Chat Tavern" in App.tsx

## [0.11.0] - 2024-03-26

### Changed
- Implemented random LLM selection for each character
- Updated error handling in llm-service.ts
- Removed Zhipu API calls from llm-service.ts

### Fixed
- Corrected error messages in ChatInterface component

## [0.10.0] - 2024-03-25

### Added
- Implemented character selection functionality
- Added basic chat interface for interacting with selected character

## [0.9.0] - 2024-03-23

### Added
- Implemented actual API calls for Zhipu, Moonshot, and Gemini AI services
- Added error handling for API calls in ChatInterface component

### Changed
- Updated llm-service.ts to use real API endpoints instead of mock responses
- Modified llm-config.ts to use environment variables for API keys
- Updated ChatInterface to handle potential errors from API calls

### Security
- Implemented use of environment variables for API keys to enhance security

## [0.8.0] - 2024-03-22

### Added
- Created basic project structure using Vite and React
- Implemented initial UI components for the chat interface
- Added placeholder character selection functionality

### Changed
- Updated README.md with project description and setup instructions

## [0.7.0] - 2024-03-21

### Added
- Set up basic Vite project with React and TypeScript
- Installed necessary dependencies
- Created initial project structure

### Changed
- Configured Vite for optimal development experience
- Updated tsconfig.json and package.json with appropriate settings

## [0.6.0] - 2024-03-20

### Added
- Initialized Git repository
- Created .gitignore file

### Changed
- Set up project directory structure

## [0.5.0] - 2024-03-19

### Added
- Conceptualized project idea
- Created initial project planning documents

## [0.4.0] - 2024-03-18

### Added
- Researched potential AI APIs for integration
- Drafted initial API integration plans

## [0.3.0] - 2024-03-17

### Added
- Explored UI/UX design options for chat interface
- Created wireframes for main application screens

## [0.2.0] - 2024-03-16

### Added
- Conducted market research on existing AI chat applications
- Identified unique selling points for the project

## [0.1.0] - 2024-03-15

### Added
- Initial project ideation
- Defined project goals and target audience

## [0.18.0] - 2024-04-02

### Changed
- Updated character prompts to prevent AI from revealing its virtual nature
- Added additional filtering in llm-service.ts to remove content that might expose AI identity

## [1.397.1816.502fix] - 2025-05-08

### Fixed
- 修复生产环境 love.saga4v.com 502 Bad Gateway 问题。
- 主要原因：Nginx全局代理配置与前端容器Nginx端口、CORS头、OPTIONS预检处理等存在冲突。
- 解决方案：
  - 确认全局Nginx的 `proxy_pass` 指向前端容器的正确端口（4173）。
  - 临时简化 `location /` 代理配置，去除多余CORS和OPTIONS处理，恢复正常访问。
  - 建议如需CORS或自定义header，逐步引入并测试。
- 优化前端Nginx日志配置，便于后续排查。
- 明确 `nginx/default.conf` 如未被include可删除，避免配置冲突。

## [1.400.2025.0603] - 2025-06-03

### Added
- 新增隐私政策（/privacy）、用户协议（/terms）页面，内容参考 Stripe 风控合规建议，支持中英文多语言。
- 角色选择页顶部新增产品专属免责声明，分两行、随机高对比度颜色，支持多语言。
- 所有法律文本、免责声明内容均通过 i18next 多语言管理，严禁硬编码。
- 更新 README.md、dev_stripe_clairifications_v039.md，详细说明实现方案与入口。
