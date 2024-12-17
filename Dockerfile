FROM node:18-alpine

WORKDIR /app

# 全局安装 rimraf
RUN npm install -g rimraf

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码和环境变量文件
COPY . .

# 确保环境变量文件存在
COPY .env.production .env

# 暴露端口
EXPOSE 4173

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --spider -q http://localhost:4173 || exit 1