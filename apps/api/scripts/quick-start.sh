#!/bin/bash

# Quick Start Guide for Subscription ID Extension
# Run this after setting up your database

set -e

echo "🚀 Whalli - Subscription ID Extension Quick Start"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Navigate to API directory
cd "$(dirname "$0")/.."

echo -e "${BLUE}Step 1: Checking Prisma Client${NC}"
if npx prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma Client is up to date${NC}"
else
    echo -e "${YELLOW}⚠️  Regenerating Prisma Client...${NC}"
    npx prisma generate
    echo -e "${GREEN}✅ Prisma Client regenerated${NC}"
fi
echo ""

echo -e "${BLUE}Step 2: Testing Database Connection${NC}"
if npx prisma db push --skip-generate --accept-data-loss > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Database connection failed${NC}"
    echo ""
    echo "Please run the database setup script first:"
    echo "  cd scripts && ./setup-db.sh"
    echo ""
    exit 1
fi
echo ""

echo -e "${BLUE}Step 3: Running Migration${NC}"
echo "This will add the 'subscriptionId' column to the users table"
echo ""

# Run migration
if npx prisma migrate dev --name add_user_subscription_id; then
    echo ""
    echo -e "${GREEN}✅ Migration applied successfully${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Migration failed or already applied${NC}"
    echo "Checking migration status..."
    echo ""
    npx prisma migrate status
fi
echo ""

echo -e "${BLUE}Step 4: Checking Migration Status${NC}"
npx prisma migrate status
echo ""

echo -e "${GREEN}=================================================="
echo "✅ Setup Complete!"
echo "==================================================${NC}"
echo ""
echo "Next steps:"
echo "1. Start development server: pnpm dev"
echo "2. Test subscription creation endpoint"
echo "3. Monitor webhook events from Stripe"
echo "4. View data in Prisma Studio: npx prisma studio"
echo ""
echo "Documentation:"
echo "- Implementation Guide: SUBSCRIPTION_ID_EXTENSION.md"
echo "- Quick Summary: SUBSCRIPTION_ID_SUMMARY.md"
echo ""
