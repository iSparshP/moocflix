FROM node:22-alpine

# Add dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create src directory
RUN mkdir -p /app/src

# Copy source code
COPY src/ ./src/
COPY config/ ./config/

# Create logs directory and set permissions
RUN mkdir -p /app/logs && \
    chown -R appuser:appgroup /app && \
    chmod -R 550 /app && \
    chmod -R 770 /app/logs

# Set environment variables
ENV NODE_ENV=production \
    PORT=3002 \
    SECURITY_HEADERS=true \
    NODE_OPTIONS="--max-old-space-size=2048"

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Use dumb-init as entrypoint
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "src/index.js"]