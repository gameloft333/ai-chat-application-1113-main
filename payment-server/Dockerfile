FROM node:18-alpine

WORKDIR /app

# 安装必要的工具
RUN apk add --no-cache curl

# 创建必要的目录
RUN mkdir -p /app/config /app/services

COPY package*.json ./
RUN npm install

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

CMD ["node", "index.js"]
