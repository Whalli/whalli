#!/bin/bash

# ========================================
# GitHub Secrets Quick Setup Script
# ========================================
# This script automatically creates GitHub secrets
# using values from .env.production.example
#
# Usage: ./scripts/quick-setup-secrets.sh
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO="Whalli/whalli"
ENV_FILE=".env.production.example"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GitHub Secrets Quick Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ File not found: $ENV_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
echo -e "${GREEN}✅ Found $ENV_FILE${NC}"
echo ""

# Function to extract value from .env file
get_env_value() {
    local key=$1
    grep "^${key}=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'"
}

# Function to add secret
add_secret() {
    local name=$1
    local value=$2
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  Skipping ${name} (empty value)${NC}"
        return 0
    fi
    
    echo -e "${BLUE}Setting ${name}...${NC}"
    echo -n "$value" | gh secret set "$name" --repo="$REPO" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${name}${NC}"
    else
        echo -e "${RED}❌ Failed: ${name}${NC}"
    fi
}

echo -e "${YELLOW}📝 Creating secrets from $ENV_FILE...${NC}"
echo ""

# ========================================
# SERVER ACCESS (Manual input required)
# ========================================
echo -e "${BLUE}=== Server Access ===${NC}"
echo ""
echo -e "${YELLOW}⚠️  These secrets require manual input:${NC}"
echo ""

read -p "Enter SERVER_HOST (e.g., 123.45.67.89): " SERVER_HOST
add_secret "SERVER_HOST" "$SERVER_HOST"

read -p "Enter SERVER_USER (e.g., ubuntu, root): " SERVER_USER
add_secret "SERVER_USER" "$SERVER_USER"

echo ""
echo -e "${YELLOW}For SSH_PRIVATE_KEY:${NC}"
echo "1. Generate key: ssh-keygen -t ed25519 -C 'github-actions' -f ~/.ssh/github_deploy_key"
echo "2. Add public key to server: ssh-copy-id -i ~/.ssh/github_deploy_key.pub user@server"
echo "3. Copy private key: cat ~/.ssh/github_deploy_key"
echo ""
read -p "Paste SSH private key (multi-line, press Ctrl+D when done): " -d $'\04' SSH_PRIVATE_KEY
add_secret "SSH_PRIVATE_KEY" "$SSH_PRIVATE_KEY"

echo ""

# ========================================
# DATABASE
# ========================================
echo -e "${BLUE}=== Database ===${NC}"
DATABASE_URL=$(get_env_value "DATABASE_URL")
add_secret "DATABASE_URL" "$DATABASE_URL"
echo ""

# ========================================
# REDIS
# ========================================
echo -e "${BLUE}=== Redis ===${NC}"
REDIS_PASSWORD=$(get_env_value "REDIS_PASSWORD")
REDIS_URL=$(get_env_value "REDIS_URL")
add_secret "REDIS_PASSWORD" "$REDIS_PASSWORD"
add_secret "REDIS_URL" "$REDIS_URL"
echo ""

# ========================================
# MINIO
# ========================================
echo -e "${BLUE}=== MinIO ===${NC}"
MINIO_ROOT_USER=$(get_env_value "MINIO_ROOT_USER")
MINIO_ROOT_PASSWORD=$(get_env_value "MINIO_ROOT_PASSWORD")
add_secret "MINIO_ROOT_USER" "$MINIO_ROOT_USER"
add_secret "MINIO_ROOT_PASSWORD" "$MINIO_ROOT_PASSWORD"

# Generate new access/secret keys
MINIO_ACCESS_KEY=$(openssl rand -hex 20)
MINIO_SECRET_KEY=$(openssl rand -base64 32)
add_secret "MINIO_ACCESS_KEY" "$MINIO_ACCESS_KEY"
add_secret "MINIO_SECRET_KEY" "$MINIO_SECRET_KEY"
echo ""

# ========================================
# AUTH
# ========================================
echo -e "${BLUE}=== Authentication ===${NC}"
JWT_SECRET=$(get_env_value "JWT_SECRET")
BETTER_AUTH_SECRET=$(get_env_value "BETTER_AUTH_SECRET")
add_secret "JWT_SECRET" "$JWT_SECRET"
add_secret "BETTER_AUTH_SECRET" "$BETTER_AUTH_SECRET"
echo ""

# ========================================
# STRIPE
# ========================================
echo -e "${BLUE}=== Stripe ===${NC}"
STRIPE_SECRET_KEY=$(get_env_value "STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET=$(get_env_value "STRIPE_WEBHOOK_SECRET")
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$(get_env_value "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
add_secret "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
add_secret "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"
add_secret "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo ""

# ========================================
# AI PROVIDERS
# ========================================
echo -e "${BLUE}=== AI Providers ===${NC}"
OPENAI_API_KEY=$(get_env_value "OPENAI_API_KEY")
ANTHROPIC_API_KEY=$(get_env_value "ANTHROPIC_API_KEY")
XAI_API_KEY=$(get_env_value "XAI_API_KEY")
add_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"
add_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"
add_secret "XAI_API_KEY" "$XAI_API_KEY"
echo ""

# ========================================
# MONITORING
# ========================================
echo -e "${BLUE}=== Monitoring ===${NC}"
GRAFANA_ADMIN_PASSWORD=$(get_env_value "GRAFANA_ADMIN_PASSWORD")
add_secret "GRAFANA_ADMIN_PASSWORD" "$GRAFANA_ADMIN_PASSWORD"
echo ""

# ========================================
# DOMAIN
# ========================================
echo -e "${BLUE}=== Domain ===${NC}"
DOMAIN=$(get_env_value "DOMAIN")
ACME_EMAIL=$(get_env_value "ACME_EMAIL")
add_secret "DOMAIN" "$DOMAIN"
add_secret "ACME_EMAIL" "$ACME_EMAIL"
echo ""

# ========================================
# SUMMARY
# ========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Secrets setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}🔍 Verify secrets at:${NC}"
echo "   https://github.com/${REPO}/settings/secrets/actions"
echo ""
echo -e "${BLUE}📝 Generated secrets (save these):${NC}"
echo "   MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}"
echo "   MINIO_SECRET_KEY=${MINIO_SECRET_KEY}"
echo ""
echo -e "${YELLOW}⚠️  Save these credentials securely!${NC}"
echo ""
