#!/bin/bash

# Whalli Monorepo - Quick Start Script
# This script helps you get started quickly

set -e

echo "🚀 Whalli Monorepo Setup"
echo "========================"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm is installed"
echo ""

# Copy environment files
echo "📝 Setting up environment files..."

if [ ! -f "packages/prisma/.env" ]; then
    cp packages/prisma/.env.example packages/prisma/.env
    echo "✅ Created packages/prisma/.env"
else
    echo "⚠️  packages/prisma/.env already exists, skipping"
fi

if [ ! -f "apps/backend/.env" ]; then
    cp apps/backend/.env.example apps/backend/.env
    echo "✅ Created apps/backend/.env"
else
    echo "⚠️  apps/backend/.env already exists, skipping"
fi

if [ ! -f "apps/web/.env.local" ]; then
    cp apps/web/.env.example apps/web/.env.local
    echo "✅ Created apps/web/.env.local"
else
    echo "⚠️  apps/web/.env.local already exists, skipping"
fi

if [ ! -f "apps/admin/.env.local" ]; then
    cp apps/admin/.env.example apps/admin/.env.local
    echo "✅ Created apps/admin/.env.local"
else
    echo "⚠️  apps/admin/.env.local already exists, skipping"
fi

echo ""
echo "⚠️  IMPORTANT: Update DATABASE_URL in the following files:"
echo "   - packages/prisma/.env"
echo "   - apps/backend/.env"
echo ""
echo "   Example: postgresql://user:password@localhost:5432/whalli?schema=public"
echo ""

read -p "Have you updated the DATABASE_URL? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please update DATABASE_URL before continuing"
    exit 1
fi

echo ""
echo "🔧 Generating Prisma Client..."
pnpm db:generate

echo ""
echo "📊 Do you want to push the schema to your database now?"
echo "   This will create tables based on the Prisma schema."
read -p "Push schema? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing schema to database..."
    pnpm db:push
    echo "✅ Schema pushed successfully"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "You can now start development:"
echo ""
echo "  pnpm dev              # Start all apps"
echo "  pnpm db:studio        # Open Prisma Studio"
echo ""
echo "Apps will be available at:"
echo "  Backend:  http://localhost:4000"
echo "  Web:      http://localhost:3000"
echo "  Admin:    http://localhost:3001"
echo ""
echo "For more information, see README.md and SETUP.md"
echo ""
