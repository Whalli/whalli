#!/bin/bash

# Docker OS Comparison Test Script
# Compare Alpine vs Debian builds for Prisma compatibility

set -e

echo "🐳 Docker OS Comparison: Alpine vs Debian"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test Docker availability
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not running"
    exit 1
fi

print_status "Starting comparison tests..."

# Build Alpine version (current)
print_status "Building Alpine version..."
if docker build -f apps/api/Dockerfile . -t whalli-api-alpine; then
    ALPINE_SIZE=$(docker images whalli-api-alpine --format "table {{.Size}}" | tail -n 1)
    print_status "✅ Alpine build successful - Size: $ALPINE_SIZE"
else
    print_error "❌ Alpine build failed"
    ALPINE_FAILED=1
fi

# Build Debian version (new)
print_status "Building Debian version..."
if docker build -f apps/api/Dockerfile.debian . -t whalli-api-debian; then
    DEBIAN_SIZE=$(docker images whalli-api-debian --format "table {{.Size}}" | tail -n 1)
    print_status "✅ Debian build successful - Size: $DEBIAN_SIZE"
else
    print_error "❌ Debian build failed"
    DEBIAN_FAILED=1
fi

# Size comparison
echo ""
echo "📊 Image Size Comparison:"
echo "========================="
if [[ -z "$ALPINE_FAILED" ]]; then
    echo "Alpine:  $ALPINE_SIZE"
fi
if [[ -z "$DEBIAN_FAILED" ]]; then
    echo "Debian:  $DEBIAN_SIZE"
fi

# Test Prisma compatibility
echo ""
print_status "Testing Prisma compatibility..."

# Test Alpine Prisma
if [[ -z "$ALPINE_FAILED" ]]; then
    print_status "Testing Prisma on Alpine..."
    if docker run --rm whalli-api-alpine node -e "
        const { PrismaClient } = require('@prisma/client');
        try {
            const prisma = new PrismaClient();
            console.log('✅ Prisma Alpine: OK');
            process.exit(0);
        } catch (error) {
            console.log('❌ Prisma Alpine: FAILED -', error.message);
            process.exit(1);
        }
    " 2>/dev/null; then
        print_status "✅ Prisma works on Alpine"
    else
        print_warning "⚠️ Prisma issues detected on Alpine"
    fi
fi

# Test Debian Prisma
if [[ -z "$DEBIAN_FAILED" ]]; then
    print_status "Testing Prisma on Debian..."
    if docker run --rm whalli-api-debian node -e "
        const { PrismaClient } = require('@prisma/client');
        try {
            const prisma = new PrismaClient();
            console.log('✅ Prisma Debian: OK');
            process.exit(0);
        } catch (error) {
            console.log('❌ Prisma Debian: FAILED -', error.message);
            process.exit(1);
        }
    " 2>/dev/null; then
        print_status "✅ Prisma works on Debian"
    else
        print_error "❌ Prisma issues detected on Debian"
    fi
fi

# Test startup time
echo ""
print_status "Testing startup time..."

if [[ -z "$ALPINE_FAILED" ]]; then
    print_status "Alpine startup test..."
    ALPINE_START_TIME=$(time (docker run --rm --name api-alpine-test -d whalli-api-alpine > /dev/null && sleep 2 && docker rm -f api-alpine-test > /dev/null) 2>&1 | grep real | awk '{print $2}')
    print_status "Alpine startup: $ALPINE_START_TIME"
fi

if [[ -z "$DEBIAN_FAILED" ]]; then
    print_status "Debian startup test..."
    DEBIAN_START_TIME=$(time (docker run --rm --name api-debian-test -d whalli-api-debian > /dev/null && sleep 2 && docker rm -f api-debian-test > /dev/null) 2>&1 | grep real | awk '{print $2}')
    print_status "Debian startup: $DEBIAN_START_TIME"
fi

# Summary
echo ""
echo "📋 Comparison Summary:"
echo "====================="
echo "Image Sizes:"
[[ -z "$ALPINE_FAILED" ]] && echo "  Alpine:  $ALPINE_SIZE"
[[ -z "$DEBIAN_FAILED" ]] && echo "  Debian:  $DEBIAN_SIZE"

echo ""
echo "Recommendations:"
echo "- For minimal size: Alpine (if Prisma issues are acceptable)"
echo "- For stability:    Debian (recommended for production)"
echo "- For development:  Debian (better debugging tools)"

echo ""
print_status "Comparison complete! Check results above ☝️"

# Cleanup
print_status "Cleaning up test containers..."
docker rmi whalli-api-alpine whalli-api-debian 2>/dev/null || true

echo "🎉 Done!"