#!/bin/bash

# ========================================
# Add Server Secrets to GitHub
# ========================================
# Adds the 3 remaining server-related secrets
# that require manual input
# ========================================

set -e

REPO="Whalli/whalli"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Server Secrets Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to add secret
add_secret() {
    local name=$1
    local value=$2
    
    echo -e "${BLUE}Setting ${name}...${NC}"
    echo -n "$value" | gh secret set "$name" --repo="$REPO"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${name} added successfully${NC}"
    else
        echo -e "${RED}❌ Failed to add ${name}${NC}"
        return 1
    fi
    echo ""
}

# ========================================
# SERVER_HOST
# ========================================
echo -e "${YELLOW}1/3 - SERVER_HOST${NC}"
echo "Enter your production server IP or hostname:"
echo "Examples: 123.45.67.89 or server.mydomain.com"
read -p "SERVER_HOST: " SERVER_HOST

if [ -z "$SERVER_HOST" ]; then
    echo -e "${RED}❌ SERVER_HOST cannot be empty${NC}"
    exit 1
fi

add_secret "SERVER_HOST" "$SERVER_HOST"

# ========================================
# SERVER_USER
# ========================================
echo -e "${YELLOW}2/3 - SERVER_USER${NC}"
echo "Enter SSH username for deployment:"
echo "Common values: ubuntu, root, deploy, admin"
read -p "SERVER_USER: " SERVER_USER

if [ -z "$SERVER_USER" ]; then
    echo -e "${RED}❌ SERVER_USER cannot be empty${NC}"
    exit 1
fi

add_secret "SERVER_USER" "$SERVER_USER"

# ========================================
# SSH_PRIVATE_KEY
# ========================================
echo -e "${YELLOW}3/3 - SSH_PRIVATE_KEY${NC}"
echo ""
echo -e "${BLUE}Options:${NC}"
echo "1. Generate a new SSH key (recommended)"
echo "2. Use an existing SSH key"
echo ""
read -p "Choose option (1 or 2): " SSH_OPTION

if [ "$SSH_OPTION" = "1" ]; then
    # Generate new SSH key
    echo ""
    echo -e "${BLUE}Generating new SSH key...${NC}"
    
    KEY_PATH="$HOME/.ssh/github_deploy_whalli"
    
    if [ -f "$KEY_PATH" ]; then
        echo -e "${YELLOW}⚠️  Key already exists at $KEY_PATH${NC}"
        read -p "Overwrite? (y/n): " OVERWRITE
        if [ "$OVERWRITE" != "y" ]; then
            echo "Using existing key..."
        else
            ssh-keygen -t ed25519 -C "github-actions-whalli" -f "$KEY_PATH" -N ""
        fi
    else
        ssh-keygen -t ed25519 -C "github-actions-whalli" -f "$KEY_PATH" -N ""
    fi
    
    echo ""
    echo -e "${GREEN}✅ SSH key generated${NC}"
    echo ""
    echo -e "${BLUE}Public key (add this to your server's ~/.ssh/authorized_keys):${NC}"
    echo -e "${YELLOW}======================================${NC}"
    cat "${KEY_PATH}.pub"
    echo -e "${YELLOW}======================================${NC}"
    echo ""
    echo -e "${BLUE}To add the public key to your server, run:${NC}"
    echo "  ssh-copy-id -i ${KEY_PATH}.pub ${SERVER_USER}@${SERVER_HOST}"
    echo ""
    read -p "Press Enter after you've added the public key to the server..."
    
    # Read private key
    SSH_PRIVATE_KEY=$(cat "$KEY_PATH")
    
elif [ "$SSH_OPTION" = "2" ]; then
    # Use existing key
    echo ""
    echo -e "${BLUE}Enter the path to your private SSH key:${NC}"
    echo "Example: ~/.ssh/id_ed25519 or ~/.ssh/id_rsa"
    read -p "Path: " KEY_PATH
    
    # Expand tilde
    KEY_PATH="${KEY_PATH/#\~/$HOME}"
    
    if [ ! -f "$KEY_PATH" ]; then
        echo -e "${RED}❌ File not found: $KEY_PATH${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}Public key (verify this is on your server):${NC}"
    echo -e "${YELLOW}======================================${NC}"
    if [ -f "${KEY_PATH}.pub" ]; then
        cat "${KEY_PATH}.pub"
    else
        ssh-keygen -y -f "$KEY_PATH"
    fi
    echo -e "${YELLOW}======================================${NC}"
    echo ""
    read -p "Confirm this key is on the server (y/n): " CONFIRM
    
    if [ "$CONFIRM" != "y" ]; then
        echo -e "${RED}❌ Aborted${NC}"
        exit 1
    fi
    
    # Read private key
    SSH_PRIVATE_KEY=$(cat "$KEY_PATH")
    
else
    echo -e "${RED}❌ Invalid option${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Adding SSH_PRIVATE_KEY to GitHub...${NC}"
add_secret "SSH_PRIVATE_KEY" "$SSH_PRIVATE_KEY"

# ========================================
# SUMMARY
# ========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All server secrets configured!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  ✅ SERVER_HOST: $SERVER_HOST"
echo "  ✅ SERVER_USER: $SERVER_USER"
echo "  ✅ SSH_PRIVATE_KEY: Added"
echo ""
echo -e "${BLUE}Total secrets in repository: 21/21${NC}"
echo ""
echo -e "${BLUE}🔍 Verify all secrets:${NC}"
echo "   https://github.com/${REPO}/settings/secrets/actions"
echo ""
echo -e "${BLUE}🚀 Ready to deploy!${NC}"
echo "   https://github.com/${REPO}/actions/workflows/deploy.yml"
echo ""
