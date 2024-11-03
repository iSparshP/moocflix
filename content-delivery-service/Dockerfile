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

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3006/api/v1/health/liveness || exit 1

CMD ["node", "src/index.js"]
EXPOSE 3006