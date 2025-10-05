#!/bin/bash

# Chat E2E Test Runner
# Run end-to-end tests for the chat SSE system

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Chat SSE E2E Tests${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo -e "${YELLOW}Please run this script from apps/api directory${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "${YELLOW}Please create .env file with DATABASE_URL and REDIS_URL${NC}"
    exit 1
fi

# Load environment variables
source .env

# Check if database is running
echo -e "${YELLOW}Checking database connection...${NC}"
if ! npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}Make sure PostgreSQL is running and DATABASE_URL is correct${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database connected${NC}"
echo ""

# Check if Redis is running
echo -e "${YELLOW}Checking Redis connection...${NC}"
if ! redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Redis connection failed (tests will still run)${NC}"
else
    echo -e "${GREEN}✅ Redis connected${NC}"
fi
echo ""

# Run Prisma migrations
echo -e "${YELLOW}Running Prisma migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✅ Migrations applied${NC}"
echo ""

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate > /dev/null
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

# Run E2E tests
echo -e "${BLUE}Running E2E tests...${NC}"
echo ""

# Set test environment
export NODE_ENV=test

# Run Jest with E2E configuration
pnpm test:e2e

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}✅ All E2E tests passed!${NC}"
    echo -e "${GREEN}======================================${NC}"
    echo ""
    echo "Test summary:"
    echo "  ✓ POST /chat/start"
    echo "  ✓ GET /chat/stream (SSE)"
    echo "  ✓ GET /chat/history"
    echo "  ✓ Complete chat flow"
    echo ""
else
    echo ""
    echo -e "${RED}======================================${NC}"
    echo -e "${RED}❌ Some E2E tests failed${NC}"
    echo -e "${RED}======================================${NC}"
    echo ""
    exit 1
fi
