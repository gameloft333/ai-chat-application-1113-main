FROM node:18-alpine

WORKDIR /app

# 设置目录权限
RUN chown -R node:node /app

# 复制 package.json 和 package-lock.json
COPY --chown=node:node package*.json ./

# 安装依赖，包括全局 typescript
RUN npm install && \
    npm install -g typescript

# 复制源代码并设置权限
COPY --chown=node:node . .

# 设置环境变量
ENV HOST=0.0.0.0
ENV PORT=4173

# 暴露端口
EXPOSE 4173

# 切换到 node 用户
USER node

# 修改启动命令
CMD ["sh", "-c", "npm run build && npm run preview"]