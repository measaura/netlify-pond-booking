#!/bin/bash

# 🔧 Create PostgreSQL Superuser
# This script creates a superuser for your current system user

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔧 PostgreSQL Superuser Setup"
echo "=============================="
echo ""

CURRENT_USER=$(whoami)

echo "Current system user: $CURRENT_USER"
echo ""

# Check if PostgreSQL is installed
if ! command -v createuser &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql@16"
    exit 1
fi

# Check if PostgreSQL is running
echo "🔍 Checking if PostgreSQL is running..."
if ! pg_isready > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running${NC}"
    echo ""
    echo "Starting PostgreSQL..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql@16 || brew services start postgresql
        sleep 3
    fi
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Try to create superuser for current user
echo "Creating superuser role for '$CURRENT_USER'..."

if createuser -s "$CURRENT_USER" 2>/dev/null; then
    echo -e "${GREEN}✅ Superuser '$CURRENT_USER' created successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  User may already exist or insufficient permissions${NC}"
    echo ""
    echo "Alternative: Create 'postgres' superuser"
    if createuser -s postgres 2>/dev/null; then
        echo -e "${GREEN}✅ Superuser 'postgres' created successfully!${NC}"
    else
        echo -e "${YELLOW}⚠️  'postgres' user may already exist${NC}"
    fi
fi

echo ""
echo "🧪 Testing database connection..."

# Test connection
if psql -U "$CURRENT_USER" -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✅ Can connect as '$CURRENT_USER'${NC}"
elif psql -U postgres -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✅ Can connect as 'postgres'${NC}"
else
    echo -e "${RED}❌ Connection test failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check PostgreSQL logs: brew services list"
    echo "  2. Restart PostgreSQL: brew services restart postgresql"
    echo "  3. Check pg_hba.conf for auth settings"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "You can now run:"
echo "  ./scripts/setup-local-db.sh"
