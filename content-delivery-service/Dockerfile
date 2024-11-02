# Use multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
USER node
CMD ["node", "src/index.js"]
EXPOSE 3010