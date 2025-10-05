#!/bin/bash

# ========================================
# GitHub Secrets Auto Setup
# ========================================
# Automatically creates all GitHub secrets
# from .env.production.example
#
# Usage: ./scripts/auto-setup-secrets.sh
# ========================================

set -e

REPO="Whalli/whalli"
ENV_FILE=".env.production.example"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Creating GitHub secrets for ${REPO}...${NC}"
echo ""

# Extract value from .env
get_value() {
    grep "^${1}=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'"
}

# Add secret
add_secret() {
    echo -e "${YELLOW}→${NC} $1"
    echo -n "$2" | gh secret set "$1" --repo="$REPO" 2>&1 | grep -v "✓" || true
}

# Database
echo -e "${BLUE}Database:${NC}"
add_secret "DATABASE_URL" "$(get_value DATABASE_URL)"

# Redis
echo -e "${BLUE}Redis:${NC}"
add_secret "REDIS_PASSWORD" "$(get_value REDIS_PASSWORD)"
add_secret "REDIS_URL" "$(get_value REDIS_URL)"

# MinIO
echo -e "${BLUE}MinIO:${NC}"
add_secret "MINIO_ROOT_USER" "$(get_value MINIO_ROOT_USER)"
add_secret "MINIO_ROOT_PASSWORD" "$(get_value MINIO_ROOT_PASSWORD)"
add_secret "MINIO_ACCESS_KEY" "$(openssl rand -hex 20)"
add_secret "MINIO_SECRET_KEY" "$(openssl rand -base64 32)"

# Auth
echo -e "${BLUE}Auth:${NC}"
add_secret "JWT_SECRET" "$(get_value JWT_SECRET)"
add_secret "BETTER_AUTH_SECRET" "$(get_value BETTER_AUTH_SECRET)"

# Stripe
echo -e "${BLUE}Stripe:${NC}"
add_secret "STRIPE_SECRET_KEY" "$(get_value STRIPE_SECRET_KEY)"
add_secret "STRIPE_WEBHOOK_SECRET" "$(get_value STRIPE_WEBHOOK_SECRET)"
add_secret "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$(get_value NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)"

# AI
echo -e "${BLUE}AI Providers:${NC}"
add_secret "OPENAI_API_KEY" "$(get_value OPENAI_API_KEY)"
add_secret "ANTHROPIC_API_KEY" "$(get_value ANTHROPIC_API_KEY)"
add_secret "XAI_API_KEY" "$(get_value XAI_API_KEY)"

# Monitoring
echo -e "${BLUE}Monitoring:${NC}"
add_secret "GRAFANA_ADMIN_PASSWORD" "$(get_value GRAFANA_ADMIN_PASSWORD)"

# Domain
echo -e "${BLUE}Domain:${NC}"
add_secret "DOMAIN" "$(get_value DOMAIN)"
add_secret "ACME_EMAIL" "$(get_value ACME_EMAIL)"

echo ""
echo -e "${GREEN}✅ Done! Secrets created for ${REPO}${NC}"
echo ""
echo -e "${YELLOW}⚠️  Still need to add manually:${NC}"
echo "   - SSH_PRIVATE_KEY (your deployment SSH key)"
echo "   - SERVER_HOST (your production server IP)"
echo "   - SERVER_USER (SSH username for deployment)"
echo ""
echo -e "${BLUE}View all secrets:${NC}"
echo "   https://github.com/${REPO}/settings/secrets/actions"
echo ""
