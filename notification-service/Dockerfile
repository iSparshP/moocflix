# Use Node 22 Alpine as base image
FROM node:22-alpine

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy app files
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -qO- http://localhost:3003/health || exit 1

# Expose port
EXPOSE 3003

# Start the service
CMD ["npm", "start"]