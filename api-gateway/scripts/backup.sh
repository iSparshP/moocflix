#!/bin/bash
set -e

BACKUP_DIR="/opt/moocflix/backups"
RETENTION_DAYS=7

# Backup database
pg_dump -U ${POSTGRES_USER} -h kong-database ${POSTGRES_DB} > ${BACKUP_DIR}/kong_db_$(date +%Y%m%d).sql

# Backup configurations
tar -czf ${BACKUP_DIR}/kong_config_$(date +%Y%m%d).tar.gz /usr/local/kong/config/

# Clean old backups
find ${BACKUP_DIR} -type f -mtime +${RETENTION_DAYS} -delete 