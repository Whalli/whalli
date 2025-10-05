#!/bin/bash

# =================================================================
# Whalli Backup Script
# =================================================================
# Creates backups of PostgreSQL database and MinIO storage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    exit 1
fi

source .env

# Create backup directory
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

print_status "Creating backup in $BACKUP_DIR"

# Backup PostgreSQL database
print_status "Backing up PostgreSQL database..."
docker-compose exec -T postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > "$BACKUP_DIR/database.sql"
print_success "Database backup completed."

# Backup MinIO data (if mc client is available)
if command -v mc &> /dev/null; then
    print_status "Backing up MinIO storage..."
    # Note: This requires MinIO client (mc) to be configured
    # mc mirror minio/$MINIO_BUCKET "$BACKUP_DIR/storage"
    print_status "MinIO backup skipped (mc client configuration required)"
else
    print_status "MinIO backup skipped (mc client not installed)"
fi

# Create compressed archive
print_status "Creating compressed archive..."
cd backups
tar -czf "$(basename $BACKUP_DIR).tar.gz" "$(basename $BACKUP_DIR)"
rm -rf "$(basename $BACKUP_DIR)"
cd ..

print_success "Backup completed: backups/$(basename $BACKUP_DIR).tar.gz"

# Clean up old backups (keep last 7 days)
find ./backups -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true

print_status "Old backups cleaned up (keeping last 7 days)"