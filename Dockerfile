FROM node:18-alpine

WORKDIR /app

# 安装健康检查工具和构建工具
RUN apk add --no-cache curl

# 安装构建工具
RUN npm install -g rimraf typescript vite @vitejs/plugin-react

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm install --include=dev

# 复制源代码和环境变量文件
COPY . .

# 确保环境变量文件存在
COPY .env.production .env

# 构建项目
RUN npm run build:prod

# 创建健康检查脚本
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'set -e' >> /healthcheck.sh && \
    echo 'echo "Running health check..."' >> /healthcheck.sh && \
    echo 'if [ -f /app/dist/index.html ]; then' >> /healthcheck.sh && \
    echo '  echo "Dist directory exists"' >> /healthcheck.sh && \
    echo '  curl -f http://localhost:4173 || exit 1' >> /healthcheck.sh && \
    echo 'else' >> /healthcheck.sh && \
    echo '  echo "Dist directory missing"' >> /healthcheck.sh && \
    echo '  exit 1' >> /healthcheck.sh && \
    echo 'fi' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

# 暴露端口
EXPOSE 4173

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=20s --start-period=120s --retries=5 \
  CMD /healthcheck.sh

# 添加调试脚本
RUN echo '#!/bin/sh' > /debug.sh && \
    echo 'echo " Debugging Container..."' >> /debug.sh && \
    echo 'pwd' >> /debug.sh && \
    echo 'ls -la' >> /debug.sh && \
    echo 'cat .env.production' >> /debug.sh && \
    echo 'cat package.json' >> /debug.sh && \
    echo 'ls -la dist' >> /debug.sh && \
    chmod +x /debug.sh

# 启动命令
CMD ["/bin/sh", "-c", "/debug.sh && npm run preview:prod"]