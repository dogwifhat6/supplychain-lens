#!/bin/bash

# SupplyChainLens Backup Script
# This script creates backups of the database and application data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/backups/supplychain-lens"
DATE=$(date +%Y%m%d_%H%M%S)
ENV_FILE="env.production"

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    print_status "Creating backup directory..."
    mkdir -p "$BACKUP_DIR/$DATE"
    print_success "Backup directory created: $BACKUP_DIR/$DATE"
}

# Backup database
backup_database() {
    print_status "Backing up database..."
    
    # Load environment variables
    source "$ENV_FILE"
    
    # Create database backup
    docker exec supplychain-postgres-prod pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --clean --if-exists --create > "$BACKUP_DIR/$DATE/database.sql"
    
    print_success "Database backup completed"
}

# Backup application data
backup_application_data() {
    print_status "Backing up application data..."
    
    # Backup ML models
    if docker exec supplychain-ml-prod test -d /app/models; then
        docker cp supplychain-ml-prod:/app/models "$BACKUP_DIR/$DATE/"
        print_success "ML models backed up"
    fi
    
    # Backup uploads
    if docker exec supplychain-backend-prod test -d /app/uploads; then
        docker cp supplychain-backend-prod:/app/uploads "$BACKUP_DIR/$DATE/"
        print_success "Uploads backed up"
    fi
    
    # Backup logs
    mkdir -p "$BACKUP_DIR/$DATE/logs"
    docker logs supplychain-backend-prod > "$BACKUP_DIR/$DATE/logs/backend.log" 2>&1 || true
    docker logs supplychain-ml-prod > "$BACKUP_DIR/$DATE/logs/ml-service.log" 2>&1 || true
    docker logs supplychain-nginx-prod > "$BACKUP_DIR/$DATE/logs/nginx.log" 2>&1 || true
    
    print_success "Application data backed up"
}

# Backup configuration
backup_configuration() {
    print_status "Backing up configuration..."
    
    # Copy environment file
    cp "$ENV_FILE" "$BACKUP_DIR/$DATE/"
    
    # Copy Docker Compose file
    cp docker-compose.prod.yml "$BACKUP_DIR/$DATE/"
    
    # Copy Nginx configuration
    cp nginx.prod.conf "$BACKUP_DIR/$DATE/"
    
    # Copy monitoring configuration
    cp -r monitoring "$BACKUP_DIR/$DATE/" 2>/dev/null || true
    
    print_success "Configuration backed up"
}

# Compress backup
compress_backup() {
    print_status "Compressing backup..."
    
    cd "$BACKUP_DIR"
    tar -czf "supplychain-lens-backup-$DATE.tar.gz" "$DATE"
    rm -rf "$DATE"
    
    print_success "Backup compressed: supplychain-lens-backup-$DATE.tar.gz"
}

# Clean old backups
clean_old_backups() {
    print_status "Cleaning old backups (keeping last 7 days)..."
    
    find "$BACKUP_DIR" -name "supplychain-lens-backup-*.tar.gz" -mtime +7 -delete
    
    print_success "Old backups cleaned"
}

# Show backup information
show_backup_info() {
    print_status "Backup Information:"
    echo "Backup location: $BACKUP_DIR"
    echo "Backup file: supplychain-lens-backup-$DATE.tar.gz"
    echo "Backup size: $(du -h "$BACKUP_DIR/supplychain-lens-backup-$DATE.tar.gz" | cut -f1)"
    echo ""
    print_warning "Store backups in a secure location!"
}

# Main execution
main() {
    print_status "Starting SupplyChainLens backup..."
    
    create_backup_dir
    backup_database
    backup_application_data
    backup_configuration
    compress_backup
    clean_old_backups
    show_backup_info
    
    print_success "Backup completed successfully!"
}

# Run main function
main "$@"
