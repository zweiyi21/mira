#!/bin/bash
# MIRA Backup Script
# Creates a backup of PostgreSQL database and uploaded files
# Usage: ./backup.sh [backup_dir]

set -e

BACKUP_DIR="${1:-$HOME/mira-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mira_backup_$TIMESTAMP"

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_info "Creating backup: $BACKUP_NAME"

# Backup PostgreSQL
log_info "Backing up PostgreSQL database..."
docker exec mira-postgres pg_dump -U mira mira > "$BACKUP_DIR/${BACKUP_NAME}_db.sql"

# Backup uploads (if exists)
UPLOADS_VOLUME=$(docker volume inspect mira_uploads --format '{{.Mountpoint}}' 2>/dev/null || echo "")
if [ -n "$UPLOADS_VOLUME" ] && [ -d "$UPLOADS_VOLUME" ]; then
    log_info "Backing up uploaded files..."
    sudo tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" -C "$UPLOADS_VOLUME" . 2>/dev/null || true
fi

# Create combined archive
log_info "Creating combined backup archive..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}_db.sql" "${BACKUP_NAME}_uploads.tar.gz" 2>/dev/null || \
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}_db.sql"

# Cleanup individual files
rm -f "${BACKUP_NAME}_db.sql" "${BACKUP_NAME}_uploads.tar.gz" 2>/dev/null || true

log_info "========================================="
log_info "Backup complete!"
log_info "========================================="
log_info "Location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
log_info ""
log_info "To restore:"
log_info "  1. Extract: tar -xzf ${BACKUP_NAME}.tar.gz"
log_info "  2. Restore DB: docker exec -i mira-postgres psql -U mira mira < ${BACKUP_NAME}_db.sql"
log_info ""

# Cleanup old backups (keep last 7)
log_info "Cleaning up old backups (keeping last 7)..."
ls -t "$BACKUP_DIR"/mira_backup_*.tar.gz 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null || true

log_info "Done!"
