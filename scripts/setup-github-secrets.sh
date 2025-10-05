#!/bin/bash

# ========================================
# GitHub Secrets Setup Script
# ========================================
# This script creates all required GitHub Actions secrets
# for the Whalli production deployment pipeline.
#
# Usage: ./scripts/setup-github-secrets.sh
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - Repository: Whalli/whalli
# ========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository
REPO="Whalli/whalli"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GitHub Secrets Setup for ${REPO}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to add secret
add_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    echo -e "${YELLOW}Setting ${secret_name}...${NC}"
    
    if [ -z "$secret_value" ]; then
        echo -e "${RED}❌ Error: ${secret_name} is empty${NC}"
        return 1
    fi
    
    # Add secret using GitHub CLI
    echo -n "$secret_value" | gh secret set "$secret_name" --repo="$REPO"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${secret_name} set successfully${NC}"
        echo -e "   ${description}"
    else
        echo -e "${RED}❌ Failed to set ${secret_name}${NC}"
        return 1
    fi
    echo ""
}

# Function to generate random secret
generate_secret() {
    openssl rand -base64 32
}

# Function to generate hex secret
generate_hex() {
    openssl rand -hex 20
}

echo -e "${BLUE}📝 This script will create all 21 GitHub Actions secrets${NC}"
echo -e "${YELLOW}⚠️  Some secrets need manual input (API keys, domain, etc.)${NC}"
echo ""
read -p "Press Enter to continue..."
echo ""

# ========================================
# SERVER ACCESS SECRETS (3)
# ========================================
echo -e "${BLUE}=== Server Access (3 secrets) ===${NC}"
echo ""

# SSH_PRIVATE_KEY
echo -e "${YELLOW}SSH_PRIVATE_KEY:${NC}"
echo "Please paste your SSH private key (including BEGIN/END lines):"
echo "Press Enter twice when done:"
SSH_PRIVATE_KEY=""
while IFS= read -r line; do
    [ -z "$line" ] && break
    SSH_PRIVATE_KEY="${SSH_PRIVATE_KEY}${line}"$'\n'
done
add_secret "SSH_PRIVATE_KEY" "$SSH_PRIVATE_KEY" "Private SSH key for server deployment"

# SERVER_HOST
read -p "Enter SERVER_HOST (e.g., 123.45.67.89): " SERVER_HOST
add_secret "SERVER_HOST" "$SERVER_HOST" "Production server IP or hostname"

# SERVER_USER
read -p "Enter SERVER_USER (e.g., ubuntu, root, deploy): " SERVER_USER
add_secret "SERVER_USER" "$SERVER_USER" "SSH username for deployment"

# ========================================
# DATABASE (1)
# ========================================
echo -e "${BLUE}=== Database (1 secret) ===${NC}"
echo ""

# DATABASE_URL
echo "Enter DATABASE_URL from Neon (https://console.neon.tech/):"
echo "Format: postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require"
read -p "DATABASE_URL: " DATABASE_URL
add_secret "DATABASE_URL" "$DATABASE_URL" "Neon Postgres connection string"

# ========================================
# APPLICATION SECRETS (4)
# ========================================
echo -e "${BLUE}=== Application Secrets (4 secrets) ===${NC}"
echo ""

# Generate REDIS_PASSWORD
REDIS_PASSWORD=$(generate_secret)
add_secret "REDIS_PASSWORD" "$REDIS_PASSWORD" "Redis password for caching"

# Generate REDIS_URL
REDIS_URL="redis://:${REDIS_PASSWORD}@redis:6379/0"
add_secret "REDIS_URL" "$REDIS_URL" "Redis connection URL"

# Generate JWT_SECRET
JWT_SECRET=$(generate_secret)
add_secret "JWT_SECRET" "$JWT_SECRET" "JWT token signing secret"

# Generate BETTER_AUTH_SECRET
BETTER_AUTH_SECRET=$(generate_secret)
add_secret "BETTER_AUTH_SECRET" "$BETTER_AUTH_SECRET" "Better Auth library secret"

# ========================================
# STRIPE (3)
# ========================================
echo -e "${BLUE}=== Stripe (3 secrets) ===${NC}"
echo ""

read -p "Enter STRIPE_SECRET_KEY (from https://dashboard.stripe.com/apikeys): " STRIPE_SECRET_KEY
add_secret "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "Stripe API secret key"

read -p "Enter STRIPE_WEBHOOK_SECRET (from https://dashboard.stripe.com/webhooks): " STRIPE_WEBHOOK_SECRET
add_secret "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET" "Stripe webhook signing secret"

read -p "Enter NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (from Stripe dashboard): " NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
add_secret "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Stripe publishable key (frontend)"

# ========================================
# AI PROVIDERS (3)
# ========================================
echo -e "${BLUE}=== AI Providers (3 secrets) ===${NC}"
echo ""

read -p "Enter OPENAI_API_KEY (from https://platform.openai.com/api-keys): " OPENAI_API_KEY
add_secret "OPENAI_API_KEY" "$OPENAI_API_KEY" "OpenAI API key (GPT-4, GPT-3.5)"

read -p "Enter ANTHROPIC_API_KEY (from https://console.anthropic.com/settings/keys): " ANTHROPIC_API_KEY
add_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY" "Anthropic API key (Claude)"

read -p "Enter XAI_API_KEY (from https://console.x.ai/): " XAI_API_KEY
add_secret "XAI_API_KEY" "$XAI_API_KEY" "xAI API key (Grok)"

# ========================================
# MINIO (4)
# ========================================
echo -e "${BLUE}=== MinIO Storage (4 secrets) ===${NC}"
echo ""

read -p "Enter MINIO_ROOT_USER (default: minioadmin, or custom): " MINIO_ROOT_USER
MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin}
add_secret "MINIO_ROOT_USER" "$MINIO_ROOT_USER" "MinIO admin username"

MINIO_ROOT_PASSWORD=$(generate_secret)
add_secret "MINIO_ROOT_PASSWORD" "$MINIO_ROOT_PASSWORD" "MinIO admin password"

MINIO_ACCESS_KEY=$(generate_hex)
add_secret "MINIO_ACCESS_KEY" "$MINIO_ACCESS_KEY" "MinIO S3 access key (API)"

MINIO_SECRET_KEY=$(generate_secret)
add_secret "MINIO_SECRET_KEY" "$MINIO_SECRET_KEY" "MinIO S3 secret key (API)"

# ========================================
# MONITORING (1)
# ========================================
echo -e "${BLUE}=== Monitoring (1 secret) ===${NC}"
echo ""

GRAFANA_ADMIN_PASSWORD=$(generate_secret)
add_secret "GRAFANA_ADMIN_PASSWORD" "$GRAFANA_ADMIN_PASSWORD" "Grafana admin user password"

# ========================================
# DOMAIN CONFIGURATION (2)
# ========================================
echo -e "${BLUE}=== Domain Configuration (2 secrets) ===${NC}"
echo ""

read -p "Enter DOMAIN (e.g., mydomain.com, without https://): " DOMAIN
add_secret "DOMAIN" "$DOMAIN" "Production domain name"

read -p "Enter ACME_EMAIL (e.g., admin@mydomain.com): " ACME_EMAIL
add_secret "ACME_EMAIL" "$ACME_EMAIL" "Email for Let's Encrypt SSL notifications"

# ========================================
# SUMMARY
# ========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All secrets configured successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo -e "   - Server Access: 3 secrets"
echo -e "   - Database: 1 secret"
echo -e "   - Application: 4 secrets"
echo -e "   - Stripe: 3 secrets"
echo -e "   - AI Providers: 3 secrets"
echo -e "   - MinIO: 4 secrets"
echo -e "   - Monitoring: 1 secret"
echo -e "   - Domain: 2 secrets"
echo -e "   ${GREEN}Total: 21 secrets${NC}"
echo ""
echo -e "${BLUE}🔍 Verify secrets:${NC}"
echo -e "   https://github.com/${REPO}/settings/secrets/actions"
echo ""
echo -e "${BLUE}🚀 Test deployment:${NC}"
echo -e "   https://github.com/${REPO}/actions"
echo ""
echo -e "${YELLOW}📝 Generated secrets saved to:${NC}"
echo -e "   /tmp/whalli-secrets-backup-$(date +%Y%m%d-%H%M%S).txt"
echo ""

# Save generated secrets for backup
BACKUP_FILE="/tmp/whalli-secrets-backup-$(date +%Y%m%d-%H%M%S).txt"
cat > "$BACKUP_FILE" << EOF
# Whalli GitHub Secrets Backup
# Generated: $(date)
# Repository: ${REPO}
# ========================================
# ⚠️  SENSITIVE FILE - DELETE AFTER VERIFICATION
# ========================================

# Application Secrets (Generated)
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=${REDIS_URL}
JWT_SECRET=${JWT_SECRET}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}

# MinIO (Generated)
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY}

# Monitoring (Generated)
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}

# ========================================
# Manual Input Secrets (NOT saved here)
# ========================================
# - SSH_PRIVATE_KEY
# - SERVER_HOST
# - SERVER_USER
# - DATABASE_URL
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY
# - XAI_API_KEY
# - MINIO_ROOT_USER
# - DOMAIN
# - ACME_EMAIL

EOF

chmod 600 "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup saved: ${BACKUP_FILE}${NC}"
echo -e "${RED}⚠️  DELETE THIS FILE after verification!${NC}"
echo ""
