FROM node:18-alpine

WORKDIR /usr/src/app

# 安装必要的工具
RUN apk add --no-cache curl

# 创建必要的目录
RUN mkdir -p /app/config /app/services

# Copy package.json and package-lock.json (or yarn.lock) for the payment server
# Adjust the path if your payment server's package.json is in a subdirectory
COPY package*.json ./
# COPY yarn.lock ./

# Install payment server dependencies
RUN npm install --production
# Or RUN yarn install --production

# 复制源代码和环境变量文件
COPY . .

# 复制环境变量文件
COPY .env.production .env

# 添加环境文件调试信息
RUN echo "检查环境文件:"
RUN ls -la /app/.env*
RUN echo "当前目录结构:"
RUN find /app -type f -name ".env*"

# 添加调试信息
RUN ls -la /app
RUN ls -la /app/config
RUN ls -la /app/services

ENV PORT=4242
ENV HOST=0.0.0.0

EXPOSE 4242

# 添加健康检查脚本
COPY healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /healthcheck.sh

# Start the payment server
CMD [ "node", "index.js" ]
