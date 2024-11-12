FROM node:22-alpine

# Install curl for healthcheck
RUN apk --no-cache add curl

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Create directory for certificates and set permissions
RUN mkdir -p src/certs && \
    chmod 755 src/certs

# Bundle app source
COPY . .

# Create empty certificate files with proper permissions
RUN cd src/certs && \
    touch ca-certificate.crt && \
    touch user-access-key.key && \
    touch user-access-certificate.crt && \
    chmod 600 ca-certificate.crt && \
    chmod 600 user-access-key.key && \
    chmod 600 user-access-certificate.crt

# Expose port
EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3006/api/v1/health/liveness || exit 1

# Start the application
CMD ["npm", "start"]