FROM node:18-alpine

WORKDIR /app

# 安装必要的工具
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=4242
ENV HOST=0.0.0.0

EXPOSE 4242

# 添加健康检查脚本
COPY healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /healthcheck.sh

CMD ["node", "index.js"]
