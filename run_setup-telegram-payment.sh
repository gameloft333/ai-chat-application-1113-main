#!/bin/bash

# 设置错误时退出
set -e

# 输出带颜色的日志
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查并安装 Node.js 和 npm
check_and_install_node() {
    echo -e "${YELLOW}[信息] 检查 Node.js 和 npm 安装状态...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}[信息] 正在安装 Node.js...${NC}"
        if [ -f /etc/system-release ] && grep -q "Amazon Linux" /etc/system-release; then
            curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        elif [ -f /etc/debian_version ]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            echo -e "${RED}[错误] 不支持的操作系统${NC}"
            exit 1
        fi
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}[错误] npm 安装失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}[成功] Node.js $(node -v) 和 npm $(npm -v) 已安装${NC}"
}

# 在��建目录之前先检查并安装依赖
check_and_install_node

echo -e "${YELLOW}[信息] 正在创建 Telegram 支付服务器目录结构...${NC}"

# 1. 创建目录
if [ ! -d "telegram-payment" ]; then
    mkdir -p telegram-payment
    echo -e "${GREEN}[成功] 创建 telegram-payment 目录成功${NC}"
else
    echo -e "${YELLOW}[提示] telegram-payment 目录已存在${NC}"
fi

# 2. 创建 Dockerfile
echo -e "${YELLOW}[信息] 创建 Dockerfile...${NC}"
cat > telegram-payment/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
EOF

# 3. 创建 package.json
echo -e "${YELLOW}[信息] 创建 package.json...${NC}"
cat > telegram-payment/package.json << 'EOF'
{
  "name": "telegram-payment",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "node-telegram-bot-api": "^0.64.0"
  }
}
EOF

# 4. 创建 index.js
echo -e "${YELLOW}[信息] 创建 index.js...${NC}"
cat > telegram-payment/index.js << 'EOF'
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const token = process.env.VITE_TELEGRAM_BOT_TOKEN;
const paymentToken = process.env.VITE_TELEGRAM_PAYMENT_PROVIDER_TOKEN;

if (!token || !paymentToken) {
    console.error('错误: 未设置 Telegram Bot Token 或 Payment Provider Token');
    process.exit(1);
}

const bot = new TelegramBot(token, {polling: true});

console.log('Telegram 支付服务已启动');
EOF

# 5. 安装依赖
echo -e "${YELLOW}[信息] 安装依赖...${NC}"
cd telegram-payment
if npm install; then
    echo -e "${GREEN}[成功] npm install 完成${NC}"
else
    echo -e "${RED}[错误] npm install 失败${NC}"
    cd ..
    exit 1
fi
cd ..

# 设置权限
echo -e "${YELLOW}[信息] 设置文件权限...${NC}"
chmod +x telegram-payment/index.js
chmod 755 telegram-payment/Dockerfile

echo -e "${GREEN}[成功] Telegram 支付服务器设置完成！${NC}"
echo -e "${YELLOW}[提示] 请确保 .env 文件中包含所有必要的环境变量。${NC}" 