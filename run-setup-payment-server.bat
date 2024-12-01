@echo off
:: 设置UTF-8编码，避免中文乱码
chcp 65001
setlocal enabledelayedexpansion

echo [信息] 正在创建支付服务器目录结构...

:: 1. 创建目录
if not exist payment-server (
    mkdir payment-server
    echo [成功] 创建 payment-server 目录成功
) else (
    echo [提示] payment-server 目录已存在
)

:: 2. 创建 Dockerfile
echo [信息] 创建 Dockerfile...
(
echo FROM node:18-alpine
echo WORKDIR /app
echo COPY package*.json ./
echo RUN npm install
echo COPY . .
echo ENV PORT=4242
echo EXPOSE 4242
echo CMD ["node", "index.js"]
) > payment-server\Dockerfile

:: 3. 创建 package.json
echo [信息] 创建 package.json...
(
echo {
echo   "name": "payment-server",
echo   "version": "1.0.0",
echo   "type": "module",
echo   "scripts": {
echo     "start": "node index.js"
echo   },
echo   "dependencies": {
echo     "cors": "^2.8.5",
echo     "dotenv": "^16.0.3",
echo     "express": "^4.18.2",
echo     "stripe": "^14.10.0"
echo   }
echo }
) > payment-server\package.json

:: 4. 复制 index.js
echo [信息] 复制 server/index.js 到 payment-server...
if exist server\index.js (
    copy /Y server\index.js payment-server\index.js
    echo [成功] index.js 复制完成
) else (
    echo [错误] server\index.js 文件不存在！
    goto error
)

:: 5. 安装依赖
echo [信息] 安装依赖...
cd payment-server
call npm install
if errorlevel 1 (
    echo [错误] npm install 失败
    cd ..
    goto error
)
cd ..

echo [成功] 支付服务器设置完成！
echo [提示] 请确保 .env 文件中包含所有必要的环境变量。
goto end

:error
echo [错误] 设置过程中出现错误，请检查以上日志。
exit /b 1

:end
echo [信息] 按任意键退出...
pause > nul