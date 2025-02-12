FROM node:18-alpine

WORKDIR /app

# 安装必要的工具
RUN apk add --no-cache curl

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

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:4173/ || exit 1

# 构建并启动服务
CMD ["sh", "-c", "npm run build && npm run preview"] 