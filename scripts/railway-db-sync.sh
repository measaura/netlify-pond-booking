#!/bin/bash

# Database Sync Utility for Railway
# This script helps sync database schema and data between local and Railway environments

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables
source .env

RAILWAY_URL="postgresql://postgres:PjOpTiGYjXyFSfPNFYpGfGQUKnOSwYLI@maglev.proxy.rlwy.net:59727/railway"

echo -e "${BLUE}🚂 Railway Database Sync Utility${NC}"
echo "=================================="

# Function to check if Railway database is reachable
check_railway_connection() {
    echo -e "${YELLOW}Checking Railway database connection...${NC}"
    if DATABASE_URL="$RAILWAY_URL" npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Railway database connection successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Cannot connect to Railway database${NC}"
        return 1
    fi
}

# Function to deploy schema to Railway
deploy_to_railway() {
    echo -e "${YELLOW}🔄 Deploying schema to Railway...${NC}"
    DATABASE_URL="$RAILWAY_URL" npx prisma migrate deploy
    DATABASE_URL="$RAILWAY_URL" npx prisma generate
    echo -e "${GREEN}✅ Schema deployed to Railway${NC}"
}

# Function to seed Railway database
seed_railway() {
    echo -e "${YELLOW}🌱 Seeding Railway database...${NC}"
    DATABASE_URL="$RAILWAY_URL" npx prisma db seed
    echo -e "${GREEN}✅ Railway database seeded${NC}"
}

# Function to reset Railway database
reset_railway() {
    echo -e "${YELLOW}⚠️  Resetting Railway database (this will delete all data)...${NC}"
    read -p "Are you sure? This will delete ALL data in Railway database (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        DATABASE_URL="$RAILWAY_URL" npx prisma migrate reset --force
        echo -e "${GREEN}✅ Railway database reset complete${NC}"
    else
        echo -e "${YELLOW}❌ Reset cancelled${NC}"
    fi
}

# Function to sync local schema to Railway
sync_schema() {
    echo -e "${YELLOW}📊 Syncing local schema to Railway...${NC}"
    DATABASE_URL="$RAILWAY_URL" npx prisma db push
    echo -e "${GREEN}✅ Schema synced to Railway${NC}"
}

# Function to backup Railway database
backup_railway() {
    echo -e "${YELLOW}💾 Creating Railway database backup...${NC}"
    BACKUP_FILE="backup_railway_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump "$RAILWAY_URL" > "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
}

# Function to compare schemas
compare_schemas() {
    echo -e "${YELLOW}🔍 Comparing local and Railway schemas...${NC}"
    echo "Local schema introspection:"
    npx prisma db pull --print
    echo ""
    echo "Railway schema introspection:"
    DATABASE_URL="$RAILWAY_URL" npx prisma db pull --print
}

# Main menu
show_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Check Railway connection"
    echo "2) Deploy migrations to Railway"
    echo "3) Sync schema to Railway (db push)"
    echo "4) Seed Railway database"
    echo "5) Reset Railway database (DANGEROUS)"
    echo "6) Create Railway backup"
    echo "7) Compare local vs Railway schemas"
    echo "8) Full sync (deploy + seed)"
    echo "9) Exit"
    echo ""
}

# Main execution
if ! check_railway_connection; then
    echo -e "${RED}Please check your Railway database URL and try again.${NC}"
    exit 1
fi

while true; do
    show_menu
    read -p "Enter your choice (1-9): " choice
    
    case $choice in
        1) check_railway_connection ;;
        2) deploy_to_railway ;;
        3) sync_schema ;;
        4) seed_railway ;;
        5) reset_railway ;;
        6) backup_railway ;;
        7) compare_schemas ;;
        8) 
            deploy_to_railway
            seed_railway
            echo -e "${GREEN}✅ Full sync complete!${NC}"
            ;;
        9) 
            echo -e "${BLUE}👋 Goodbye!${NC}"
            break 
            ;;
        *) 
            echo -e "${RED}Invalid option. Please choose 1-9.${NC}" 
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done