FROM node:18-alpine

WORKDIR /usr/src/app

# 安装必要的工具
RUN apk add --no-cache curl

# 创建必要的目录
RUN mkdir -p /app/config /app/services

# Copy package.json and package-lock.json from the project root (build context is now project root)
COPY package.json ./
COPY package-lock.json ./
# If you use yarn:
# COPY yarn.lock ./

# Install payment server dependencies
RUN npm install --production
# Or if you use yarn:
# RUN yarn install --production --frozen-lockfile

# Copy the payment-server-specific application code from the ./payment-server directory (relative to context)
COPY ./payment-server/ /usr/src/app/

# Copy .env.production from ./payment-server (relative to context) to .env in WORKDIR (/usr/src/app)
# This assumes .env.production is specific to payment-server and meant to be copied from its subdirectory.
# If .env.production is at project root and shared by all services, this should be: COPY .env.production .env
COPY ./payment-server/.env.production .env

# 添加环境文件调试信息
RUN echo "检查环境文件 (in /usr/src/app):"
RUN ls -la /usr/src/app/.env*
RUN echo "当前目录结构 (of /usr/src/app):"
RUN find /usr/src/app -maxdepth 1 -type f -name ".env*"
RUN echo "Listing /app (created by mkdir earlier):"
RUN ls -la /app

# 添加调试信息
RUN ls -la /app
RUN ls -la /app/config
RUN ls -la /app/services

ENV PORT=4242
ENV HOST=0.0.0.0

EXPOSE 4242

# healthcheck.sh needs to be copied from its location relative to new context
COPY ./payment-server/healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /healthcheck.sh

# Start the payment server
CMD [ "node", "index.js" ]
