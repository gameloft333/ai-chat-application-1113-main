#!/bin/bash

# 设置错误时退出
set -e

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 设置项目名称
PROJECT_NAME="ai-chat-application-1113-main"

# 输出带时间戳的日志
log() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 错误: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] 成功: $1${NC}"
}

# 检查并安装 Node.js 和 npm
check_and_install_node() {
    log "检查 Node.js 和 npm 安装状态..."
    
    if ! command -v node &> /dev/null; then
        log "正在安装 Node.js..."
        if [ -f /etc/system-release ] && grep -q "Amazon Linux" /etc/system-release; then
            curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        elif [ -f /etc/debian_version ]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            error "不支持的操作系统"
            exit 1
        fi
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm 安装失败"
        exit 1
    fi
    
    success "Node.js $(node -v) 和 npm $(npm -v) 已安装"
}

# 设置前端服务
setup_frontend() {
    log "正在设置前端服务..."
    
    # 1. 创建 Dockerfile
    log "创建前端 Dockerfile..."
    cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖，包括全局 typescript
RUN npm install && \
    npm install -g typescript

# 复制源代码
COPY . .

# 设置环境变量
ENV HOST=0.0.0.0
ENV PORT=4173

# 暴露端口
EXPOSE 4173

# 修改启动命令
CMD ["sh", "-c", "npm run build && npm run preview"]
EOF

    # 2. 修改 docker-compose.yml
    log "更新 docker-compose.yml..."
    cat > docker-compose.yml << 'EOF'
version: '3'
services:
  frontend:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "4173:4173"
    environment:
      # AI API Keys
      - VITE_MOONSHOT_API_KEY=${VITE_MOONSHOT_API_KEY}
      - VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}
      # App Config
      - NODE_ENV=production
      - VITE_API_KEY=${VITE_API_KEY}
      - VITE_API_URL=http://payment:4242
      # Firebase Config
      - VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
      - VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
      - VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
      - VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
      - VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
      - VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
      - VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}
      - HOST=0.0.0.0
    volumes:
      - ./src:/app/src:ro
      - ./public:/app/public:ro
    command: >
      sh -c "
        echo '清理构建目录...' &&
        rm -rf dist/* &&
        echo '开始构建前端项目...' &&
        npm run build &&
        echo '构建完成，开始预览...' &&
        npm run preview
      "
    restart: unless-stopped
EOF

    success "前端服务配置完成"
}

# 设置支付服务器
setup_payment_server() {
    log "正在设置支付服务器..."
    
    # 1. 创建目录
    if [ ! -d "payment-server" ]; then
        mkdir -p payment-server
        success "创建 payment-server 目录成功"
    else
        log "payment-server 目录已存在"
    fi

    # 2. 创建 Dockerfile
    log "创建支付服务器 Dockerfile..."
    cat > payment-server/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT=4242
EXPOSE 4242
CMD ["node", "index.js"]
EOF

    # 3. 创建 package.json
    log "创建支付服务器 package.json..."
    cat > payment-server/package.json << 'EOF'
{
  "name": "payment-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "stripe": "^14.10.0"
  }
}
EOF

    # 4. 复制 index.js
    log "复制 server/index.js 到 payment-server..."
    if [ -f "server/index.js" ]; then
        cp -f server/index.js payment-server/index.js
        success "index.js 复制完成"
    else
        error "server/index.js 文件不存在！"
        exit 1
    fi

    # 5. 安装依赖
    log "安装支付服务器依赖..."
    cd payment-server
    if npm install; then
        success "支付服务器 npm install 完成"
    else
        error "支付服务器 npm install 失败"
        cd ..
        exit 1
    fi
    cd ..

    # 设置权限
    chmod +x payment-server/index.js
    chmod 755 payment-server/Dockerfile
}

# 设置 Telegram 支付服务器
setup_telegram_payment() {
    log "正在设置 Telegram 支付服务器..."
    
    # 1. 创建目录
    if [ ! -d "telegram-payment" ]; then
        mkdir -p telegram-payment
        success "创建 telegram-payment 目录成功"
    else
        log "telegram-payment 目录已存在"
    fi

    # 2. 创建 Dockerfile
    log "创建 Telegram 支付服务器 Dockerfile..."
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
    log "创建 Telegram 支付服务器 package.json..."
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
    log "创建 Telegram 支付服务器 index.js..."
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
    log "安装 Telegram 支付服务器依赖..."
    cd telegram-payment
    if npm install; then
        success "Telegram 支付服务器 npm install 完成"
    else
        error "Telegram 支付服务器 npm install 失败"
        cd ..
        exit 1
    fi
    cd ..

    # 设置权限
    chmod +x telegram-payment/index.js
    chmod 755 telegram-payment/Dockerfile
}

# 主要的服务管理功能
manage_services() {
    # 1. 停止所有容器
    log "正在停止所有 Docker 容器..."
    docker-compose down
    success "Docker Compose 服务已停止"

    # 2. 强制删除相关容器
    log "正在删除所有相关容器..."
    CONTAINERS=$(docker ps -a | grep "${PROJECT_NAME}" | awk '{print $1}')
    if [ ! -z "$CONTAINERS" ]; then
        docker rm -f $CONTAINERS
        success "相关容器已删除"
    else
        log "没有找到相关容器"
    fi

    # 3. 清理网络
    log "正在清理未使用的网络..."
    docker network prune -f
    success "网络已清理"

    # 4. 检查端口占用
    log "检查端口 4173 占用情况..."
    PORT_CHECK=$(sudo netstat -tulpn | grep 4173)
    if [ ! -z "$PORT_CHECK" ]; then
        error "端口 4173 被占用: \n$PORT_CHECK"
        log "尝试结束占用端口的进程..."
        sudo kill -9 $(sudo lsof -t -i:4173) 2>/dev/null || true
        sleep 2
    fi

    # 5. 删除本地 dist 目录
    log "正在清理 dist 目录..."
    rm -rf dist
    success "dist 目录已清理"

    # 6. 重启 Docker 服务
    log "正在重启 Docker 服务..."
    sudo systemctl restart docker
    sleep 5
    if systemctl is-active --quiet docker; then
        success "Docker 服务已重启"
    else
        error "Docker 服务重启失败"
        exit 1
    fi

    # 7. 清理 Docker 系统资源
    log "正在清理 Docker 系统资源..."
    docker system prune -f
    success "Docker 系统资源已清理"

    # 8. 重新构建前端
    log "正在重新构建前端服务..."
    docker-compose build --no-cache frontend
    if [ $? -eq 0 ]; then
        success "前端服务构建成功"
    else
        error "前端服务构建失败"
        exit 1
    fi

    # 9. 启动所有服务
    log "正在启动所有服务..."
    if docker-compose up -d; then
        success "所有服务已启动"
        
        # 等待服务完全启动
        log "等待服务启动..."
        sleep 10
        
        # 检查各个服务的状态
        log "检查各个服务状态..."
        docker-compose ps
        
        # 检查前端服务是否正常
        FRONTEND_STATUS=$(docker-compose ps frontend | grep "Up")
        if [ -z "$FRONTEND_STATUS" ]; then
            error "前端服务未正常启动，查看日志..."
            docker-compose logs frontend
            exit 1
        fi
        
        # 检查支付服务是否正常
        PAYMENT_STATUS=$(docker-compose ps payment | grep "Up")
        if [ -z "$PAYMENT_STATUS" ]; then
            error "支付服务未正常启动，查看日志..."
            docker-compose logs payment
            exit 1
        fi
        
        # 检查 Telegram 支付服务是否正常
        TELEGRAM_STATUS=$(docker-compose ps telegram-payment | grep "Up")
        if [ -z "$TELEGRAM_STATUS" ]; then
            error "Telegram 支付服务未正常启动，查看日志..."
            docker-compose logs telegram-payment
            exit 1
        fi
        
        success "所有服务已成功启动！"
        
        # 显示所有容器状态
        echo -e "\n当前运行的容器："
        docker ps
        
        # 显示服务访问信息
        echo -e "\n服务访问信息："
        echo "前端服务: http://localhost:4173"
        echo "支付服务: http://localhost:4242"
        echo "Telegram支付服务: http://localhost:3000"
        
        # 持续显示日志
        log "显示服务日志（按 Ctrl+C 退出）..."
        echo "----------------------------------------"
        docker-compose logs -f
    else
        error "服务启动失败"
        exit 1
    fi
}

# 主程序
main() {
    # 检查当前目录
    if [[ ! $(pwd) == */${PROJECT_NAME} ]]; then
        error "请在 ${PROJECT_NAME} 项目目录下运行此脚本"
        exit 1
    fi

    # 检查并安装 Node.js
    check_and_install_node

    # 设置支付服务器
    setup_payment_server

    # 设置 Telegram 支付服务器
    setup_telegram_payment

    # 管理服务
    manage_services
}

# 执行主程序
main 