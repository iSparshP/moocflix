#!/bin/bash

# Exit on any error
set -e

# Variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="setup_${TIMESTAMP}.log"
CONFIG_DIR="./config"
REQUIRED_DIRS=("services" "routes" "plugins")

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log "Error: Docker is not installed"
        exit 1
    }
    
    if ! command -v docker-compose &> /dev/null; then
        log "Error: Docker Compose is not installed"
        exit 1
    }
}

# Create directory structure
create_directories() {
    log "Creating directory structure..."
    
    for dir in "${REQUIRED_DIRS[@]}"; do
        mkdir -p "$CONFIG_DIR/$dir"
        log "Created directory: $CONFIG_DIR/$dir"
    done
}

# Validate configuration files
validate_configs() {
    log "Validating configuration files..."
    
    local config_files=(
        "services/notification-management.yml"
        "services/content-management.yml"
        "services/user-management.yml"
        "services/course-management.yml"
        "routes/notification-routes.yml"
        "routes/content-routes.yml"
        "routes/user-routes.yml"
        "routes/course-routes.yml"
        "plugins/cors.yml"
        "plugins/rate-limiting.yml"
        "plugins/logging.yml"
    )
    
    for file in "${config_files[@]}"; do
        if [ ! -f "$CONFIG_DIR/$file" ]; then
            log "Error: Missing configuration file: $CONFIG_DIR/$file"
            exit 1
        fi
    done
}

# Setup Kong configuration
setup_kong() {
    log "Setting up Kong configuration..."
    
    # Create Kong docker network if it doesn't exist
    docker network create kong-net 2>/dev/null || true
    
    # Pull necessary Docker images
    log "Pulling Docker images..."
    docker pull kong:latest
    
    # Initialize Kong database
    log "Initializing Kong database..."
    docker-compose up -d kong-database
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 30
    
    # Run Kong migrations
    log "Running Kong migrations..."
    docker-compose run --rm kong kong migrations bootstrap
}

# Validate environment variables
validate_env() {
    required_vars=(
        "USER_SERVICE_URL"
        "USER_SERVICE_PORT"
        # ... add all required variables
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log "Error: Missing required environment variable: $var"
            exit 1
        fi
    done
}

# Main execution
main() {
    log "Starting MOOCflix API Gateway setup..."
    
    check_dependencies
    create_directories
    validate_configs
    setup_kong
    validate_env
    
    log "Setup completed successfully!"
}

main "$@"