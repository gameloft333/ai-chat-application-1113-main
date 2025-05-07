# 未被引用的 src/Dockerfile，或加注释防止误用。
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build
ENV PORT=4242

EXPOSE 4242

CMD ["node", "index.js"]

# 未被引用的 src/Dockerfile，或加注释防止误用。
