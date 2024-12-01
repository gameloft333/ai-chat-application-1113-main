FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4173

ENV HOST=0.0.0.0
ENV PORT=4173

USER node

CMD ["sh", "-c", "npm run build && npm run preview"] 