#!/bin/bash
# MIRA AWS Lightsail Deployment Script
# Run this script on a fresh Amazon Linux 2023 Lightsail instance
# Usage: curl -sSL <raw-url> | bash
#    or: ./lightsail-setup.sh

set -e

echo "========================================="
echo "MIRA AWS Lightsail Deployment"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as ec2-user
if [ "$USER" != "ec2-user" ]; then
    log_warn "This script is designed for Amazon Linux 2023 ec2-user"
fi

# Step 1: System Update
log_info "Updating system packages..."
sudo dnf update -y

# Step 2: Install Docker
log_info "Installing Docker..."
sudo dnf install docker git -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Step 3: Install Docker Compose
log_info "Installing Docker Compose..."
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Verify installations
log_info "Verifying installations..."
docker --version
docker compose version

log_info "========================================="
log_info "Base setup complete!"
log_info "========================================="
log_info ""
log_info "IMPORTANT: You must log out and log back in for docker group to take effect."
log_info ""
log_info "Next steps:"
log_info "1. Exit and reconnect: exit"
log_info "2. Clone your repository: git clone <your-repo-url> ~/mira"
log_info "3. Start the application: cd ~/mira && docker compose --profile full up -d"
log_info ""
log_info "For HTTPS setup (optional):"
log_info "  sudo dnf install certbot -y"
log_info "  sudo certbot certonly --standalone -d yourdomain.com"
log_info ""
