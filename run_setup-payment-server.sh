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
        # 对于 Amazon Linux 2
        if [ -f /etc/system-release ] && grep -q "Amazon Linux" /etc/system-release; then
            curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        # 对于 Ubuntu/Debian
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

# 在创建目录之前先检查并安装依赖
check_and_install_node

echo -e "${YELLOW}[信息] 正在创建支付服务器目录结构...${NC}"

# 1. 创建目录
if [ ! -d "payment-server" ]; then
    mkdir -p payment-server
    echo -e "${GREEN}[成功] 创建 payment-server 目录成功${NC}"
else
    echo -e "${YELLOW}[提示] payment-server 目录已存在${NC}"
fi

# 2. 创建 Dockerfile
echo -e "${YELLOW}[信息] 创建 Dockerfile...${NC}"
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
echo -e "${YELLOW}[信息] 创建 package.json...${NC}"
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
echo -e "${YELLOW}[信息] 复制 server/index.js 到 payment-server...${NC}"
if [ -f "server/index.js" ]; then
    cp -f server/index.js payment-server/index.js
    echo -e "${GREEN}[成功] index.js 复制完成${NC}"
else
    echo -e "${RED}[错误] server/index.js 文件不存在！${NC}"
    exit 1
fi

# 5. 安装依赖
echo -e "${YELLOW}[信息] 安装依赖...${NC}"
cd payment-server
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
chmod +x payment-server/index.js
chmod 755 payment-server/Dockerfile

echo -e "${GREEN}[成功] 支付服务器设置完成！${NC}"
echo -e "${YELLOW}[提示] 请确保 .env 文件中包含所有必要的环境变量。${NC}" 