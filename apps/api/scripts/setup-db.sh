#!/bin/bash

# Database Setup Script for Whalli
# This script helps set up PostgreSQL for the Whalli project

set -e

echo "🗄️  Whalli Database Setup"
echo "========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "Install with: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is installed${NC}"

# Check if PostgreSQL service is running
if ! systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}⚠️  PostgreSQL service is not running${NC}"
    echo "Starting PostgreSQL..."
    sudo systemctl start postgresql
    echo -e "${GREEN}✅ PostgreSQL service started${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL service is running${NC}"
fi

echo ""
echo "Database Configuration Options:"
echo "================================"
echo ""
echo "1. Use existing PostgreSQL user 'postgres'"
echo "2. Create new PostgreSQL user for Whalli"
echo "3. Test existing connection from .env"
echo "4. Exit"
echo ""

read -p "Select option (1-4): " option

case $option in
    1)
        echo ""
        read -sp "Enter password for PostgreSQL user 'postgres': " pg_password
        echo ""
        
        # Test connection
        if PGPASSWORD="$pg_password" psql -h localhost -U postgres -d postgres -c '\q' 2>/dev/null; then
            echo -e "${GREEN}✅ Connection successful${NC}"
            
            # Create database if it doesn't exist
            PGPASSWORD="$pg_password" psql -h localhost -U postgres -d postgres -c "CREATE DATABASE whalli;" 2>/dev/null || true
            
            # Update .env file
            DATABASE_URL="postgresql://postgres:${pg_password}@localhost:5432/whalli"
            
            # Backup current .env
            cp ../.env ../.env.backup
            
            # Update DATABASE_URL in .env
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" ../.env
            
            echo -e "${GREEN}✅ .env file updated${NC}"
            echo -e "${GREEN}✅ Database 'whalli' created${NC}"
        else
            echo -e "${RED}❌ Connection failed. Please check your password.${NC}"
            exit 1
        fi
        ;;
        
    2)
        echo ""
        read -p "Enter new PostgreSQL username: " new_user
        read -sp "Enter password for new user: " new_password
        echo ""
        read -sp "Enter PostgreSQL admin password: " admin_password
        echo ""
        
        # Create user and database
        if PGPASSWORD="$admin_password" psql -h localhost -U postgres -d postgres <<EOF
CREATE USER ${new_user} WITH PASSWORD '${new_password}';
CREATE DATABASE whalli OWNER ${new_user};
GRANT ALL PRIVILEGES ON DATABASE whalli TO ${new_user};
EOF
        then
            echo -e "${GREEN}✅ User and database created${NC}"
            
            # Update .env file
            DATABASE_URL="postgresql://${new_user}:${new_password}@localhost:5432/whalli"
            
            # Backup current .env
            cp ../.env ../.env.backup
            
            # Update DATABASE_URL in .env
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" ../.env
            
            echo -e "${GREEN}✅ .env file updated${NC}"
        else
            echo -e "${RED}❌ Failed to create user and database${NC}"
            exit 1
        fi
        ;;
        
    3)
        echo ""
        echo "Testing connection from .env..."
        
        if cd .. && npx prisma db push --skip-generate 2>&1 | grep -q "already in sync\|applied"; then
            echo -e "${GREEN}✅ Database connection successful${NC}"
        else
            echo -e "${RED}❌ Database connection failed${NC}"
            echo "Please check your DATABASE_URL in .env file"
            exit 1
        fi
        ;;
        
    4)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: npx prisma migrate dev --name add_user_subscription_id"
echo "2. Run: npx prisma generate"
echo "3. Start your API: pnpm dev"
