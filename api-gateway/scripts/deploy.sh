#!/bin/bash

# Exit on any error
set -e

# Variables
DEPLOY_ENV=${1:-"development"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="deploy_${TIMESTAMP}.log"
APP_DIR="/path/to/your/app"
BACKUP_DIR="/path/to/backups"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check environment
if [ -z "$DEPLOY_ENV" ]; then
    log "Error: Environment not specified"
    exit 1
fi

# Create backup
log "Creating backup..."
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" "$APP_DIR"

# Deploy application
log "Starting deployment to $DEPLOY_ENV environment..."

# Build steps
log "Building application..."
npm install
npm run build

# Deploy steps
log "Deploying application..."
# Add your deployment commands here
# Example: rsync, scp, or other deployment methods

log "Deployment completed successfully!"