#!/bin/bash
# MIRA Deployment Script
# Run after lightsail-setup.sh and SSH reconnection
# Usage: ./deploy.sh [options]
#
# Options:
#   --domain DOMAIN    Set production domain (enables HTTPS config)
#   --jwt-secret KEY   Set JWT secret (auto-generated if not provided)
#   --pull             Pull latest changes before deploying

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Parse arguments
DOMAIN=""
JWT_SECRET=""
PULL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --jwt-secret)
            JWT_SECRET="$2"
            shift 2
            ;;
        --pull)
            PULL=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

log_info "========================================="
log_info "MIRA Application Deployment"
log_info "========================================="

# Pull latest if requested
if [ "$PULL" = true ]; then
    log_info "Pulling latest changes..."
    git pull origin main
fi

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    log_info "Generated new JWT secret"
fi

# Determine allowed origins
if [ -n "$DOMAIN" ]; then
    ALLOWED_ORIGINS="https://$DOMAIN,http://$DOMAIN,http://localhost:3000"
    log_info "Domain configured: $DOMAIN"
else
    # Get public IP
    PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "localhost")
    ALLOWED_ORIGINS="http://$PUBLIC_IP:3000,http://localhost:3000,http://localhost:5173"
    log_info "Using IP-based access: $PUBLIC_IP"
fi

# Create .env file
log_info "Creating environment configuration..."
cat > .env << EOF
# MIRA Production Environment
# Generated on $(date)

JWT_SECRET=$JWT_SECRET
ALLOWED_ORIGINS=$ALLOWED_ORIGINS
EOF

log_info "Environment file created: .env"

# Stop existing containers
log_info "Stopping existing containers (if any)..."
docker compose --profile full down 2>/dev/null || true

# Build and start containers
log_info "Building and starting containers..."
docker compose --profile full up -d --build

# Wait for services to be healthy
log_info "Waiting for services to start..."
sleep 10

# Check status
log_info "Checking service status..."
docker compose ps

# Get access URL
if [ -n "$DOMAIN" ]; then
    ACCESS_URL="https://$DOMAIN"
else
    PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "localhost")
    ACCESS_URL="http://$PUBLIC_IP:3000"
fi

log_info "========================================="
log_info "Deployment complete!"
log_info "========================================="
log_info ""
log_info "Access MIRA at: $ACCESS_URL"
log_info ""
log_info "Useful commands:"
log_info "  View logs:     docker compose logs -f"
log_info "  Stop:          docker compose --profile full down"
log_info "  Restart:       docker compose --profile full restart"
log_info "  Update:        ./deploy/deploy.sh --pull"
log_info ""

if [ -z "$DOMAIN" ]; then
    log_warn "Running without HTTPS. For production, consider:"
    log_warn "  1. Register a domain"
    log_warn "  2. Run: ./deploy/deploy.sh --domain yourdomain.com"
    log_warn "  3. Setup SSL with certbot"
fi
