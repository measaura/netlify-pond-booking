#!/bin/bash

# 🎣 Pond Booking - Local Database Setup Script
# This script automates the setup of local PostgreSQL database

set -e  # Exit on error

echo "🎣 Pond Booking - Local Database Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="pond_booking_local"
DB_USER="pond_admin"
DB_PASSWORD="pond_secure_2024"
DB_HOST="localhost"
DB_PORT="5432"

echo "📋 Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Check if PostgreSQL is installed
echo "🔍 Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql@16"
    echo "  Ubuntu: sudo apt install postgresql postgresql-contrib"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

PSQL_VERSION=$(psql --version | awk '{print $3}')
echo -e "${GREEN}✅ PostgreSQL $PSQL_VERSION found${NC}"
echo ""

# Detect PostgreSQL superuser
echo "🔍 Detecting PostgreSQL superuser..."
POSTGRES_USER=""

# Try common superuser names
for user in postgres $USER $(whoami); do
    if psql -U "$user" -c '\q' 2>/dev/null; then
        POSTGRES_USER="$user"
        break
    fi
done

if [ -z "$POSTGRES_USER" ]; then
    echo -e "${RED}❌ Could not find PostgreSQL superuser${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. PostgreSQL not configured for your user"
    echo "  2. No superuser role exists"
    echo ""
    echo "Quick fix - Create superuser role:"
    echo "  createuser -s $(whoami)"
    echo ""
    echo "Or specify user manually:"
    echo "  createuser -s postgres"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Using PostgreSQL superuser: $POSTGRES_USER${NC}"
echo ""

# Check if PostgreSQL is running
echo "🔍 Checking if PostgreSQL is running..."
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running${NC}"
    echo ""
    echo "Starting PostgreSQL..."
    
    # Try to start PostgreSQL based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start postgresql@16 || brew services start postgresql
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start postgresql
    else
        echo -e "${RED}❌ Unable to auto-start PostgreSQL on this OS${NC}"
        echo "Please start PostgreSQL manually and run this script again"
        exit 1
    fi
    
    # Wait a bit for PostgreSQL to start
    sleep 3
    
    if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
        echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Create database and user
echo "🗄️  Setting up database..."

# Check if database exists
if psql -U $POSTGRES_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        psql -U $POSTGRES_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
    else
        echo "Keeping existing database"
    fi
fi

# Create database if it doesn't exist
if ! psql -U $POSTGRES_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Creating database '$DB_NAME'..."
    psql -U $POSTGRES_USER -c "CREATE DATABASE $DB_NAME;"
    echo -e "${GREEN}✅ Database created${NC}"
fi

# Create user if doesn't exist
echo "Creating user '$DB_USER'..."
psql -U $POSTGRES_USER -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
psql -U $POSTGRES_USER -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
psql -U $POSTGRES_USER -c "ALTER USER $DB_USER CREATEDB;" # For Prisma shadow database
psql -U $POSTGRES_USER -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# For PostgreSQL 15+, also grant schema privileges
psql -U $POSTGRES_USER -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" || true
psql -U $POSTGRES_USER -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;" || true
psql -U $POSTGRES_USER -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;" || true

echo -e "${GREEN}✅ User configured with full privileges${NC}"
echo ""

# Create .env file
echo "📝 Creating .env file..."
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

if [ -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to update it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Backup existing .env
        cp .env .env.backup
        echo "Backed up existing .env to .env.backup"
        
        # Update DATABASE_URL
        if grep -q "^DATABASE_URL=" .env; then
            # Replace existing DATABASE_URL
            sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
            rm .env.bak
        else
            # Add DATABASE_URL
            echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
        fi
        echo -e "${GREEN}✅ .env file updated${NC}"
    fi
else
    # Create new .env from example
    if [ -f .env.example ]; then
        cp .env.example .env
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
        rm .env.bak
    else
        echo "DATABASE_URL=\"$DATABASE_URL\"" > .env
    fi
    echo -e "${GREEN}✅ .env file created${NC}"
fi

echo ""
echo "🔨 Installing dependencies..."
if command -v bun &> /dev/null; then
    bun install
else
    npm install
fi

echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🚀 Running database migrations..."
npx prisma migrate dev --name init

echo ""
echo "🌱 Seeding database with test data..."
npx prisma db seed

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Database Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo "  Connection: $DATABASE_URL"
echo ""
echo "🔑 Test Accounts:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  User:    user1@fishing.com / 123456@$"
echo "  Manager: manager1@fishing.com / 123456@$"
echo "  Admin:   admin@fishing.com / 123456@$"
echo ""
echo "🚀 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Start dev server:  npm run dev"
echo "  2. Open browser:      http://localhost:3000"
echo "  3. Open Prisma Studio: npx prisma studio"
echo "  4. View logs:         Check terminal output"
echo ""
echo "📚 Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Testing Guide: TESTING_GUIDE.md"
echo "  API Docs:      Check /api routes"
echo ""
echo "Happy Fishing! 🎣"
