#!/bin/bash

set -e

# Variables
DEPLOY_ENV=${1:-"production"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="deploy_${TIMESTAMP}.log"
APP_DIR="/opt/moocflix/api-gateway"
BACKUP_DIR="/opt/moocflix/backups"

# Load environment variables
load_env() {
    if [ -f ".env.${DEPLOY_ENV}" ]; then
        export $(cat .env.${DEPLOY_ENV} | grep -v '^#' | xargs)
    else
        log "Error: Environment file .env.${DEPLOY_ENV} not found"
        exit 1
    fi
}

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check SSL certificates
check_ssl_certificates() {
    if [ ! -f "${SSL_CERT_PATH}" ] || [ ! -f "${SSL_KEY_PATH}" ]; then
        log "Error: SSL certificates not found"
        exit 1
    fi
}

# Validate environment variables
validate_env() {
    required_vars=(
        "KONG_HTTP_PORT"
        "KONG_HTTPS_PORT"
        "KONG_ADMIN_PORT"
        "POSTGRES_PASSWORD"
        "SSL_CERT_PATH"
        "SSL_KEY_PATH"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log "Error: Required environment variable $var is not set"
            exit 1
        fi
    done
}

# Main execution
main() {
    log "Starting deployment in ${DEPLOY_ENV} environment..."
    
    load_env
    validate_env
    check_ssl_certificates
    
    # Create backup
    log "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    tar -czf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" "$APP_DIR"
    
    # Deploy
    log "Deploying new version..."
    docker-compose -f docker-compose.yml --env-file .env.${DEPLOY_ENV} up -d
    
    # Health check
    log "Performing health check..."
    curl -f http://localhost:${KONG_HTTP_PORT}/health || (log "Health check failed" && exit 1)
    
    log "Deployment completed successfully!"
}

main "$@"