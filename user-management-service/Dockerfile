# Use a specific version for better reproducibility
FROM node:16-alpine

# Add dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies with specific flags for production
RUN npm ci --only=production \
    && npm cache clean --force

# Copy application code with proper ownership
COPY --chown=appuser:appgroup . .

# Set permissions
RUN chmod -R 550 /app \
    && chmod -R 770 /app/logs

# Set environment variables
ENV NODE_ENV=production \
    PORT=3007 \
    # Add security headers
    SECURITY_HEADERS=true \
    # Increase heap size for larger workloads
    NODE_OPTIONS="--max-old-space-size=2048"

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/v1/system/health || exit 1

# Use dumb-init as entrypoint for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "src/index.js"]