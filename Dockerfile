FROM node:18-alpine

WORKDIR /app

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

# 暴露端口
EXPOSE 4173

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=20s --start-period=120s --retries=5 \
  CMD curl -f http://localhost:4173 || exit 1