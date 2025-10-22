#!/bin/bash

# 🚂 Railway Deployment Script
# Automates deployment to Railway with PostgreSQL

set -e

echo "🚂 Railway Deployment Script"
echo "============================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found${NC}"
    echo ""
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
    echo ""
fi

# Check if logged in
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Railway${NC}"
    echo ""
    echo "Opening browser for authentication..."
    railway login
    echo ""
fi

RAILWAY_USER=$(railway whoami)
echo -e "${GREEN}✅ Logged in as: $RAILWAY_USER${NC}"
echo ""

# Check if project is linked
if [ ! -f .railway/project.json ]; then
    echo -e "${YELLOW}⚠️  No Railway project linked${NC}"
    echo ""
    read -p "Do you want to create a new project or link existing? (new/existing) " -r
    echo ""
    
    if [[ $REPLY == "new" ]]; then
        echo "Creating new Railway project..."
        railway init
    else
        echo "Please link existing project:"
        railway link
    fi
    echo ""
fi

PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
echo -e "${BLUE}📦 Project ID: $PROJECT_ID${NC}"
echo ""

# Check for PostgreSQL database
echo "🗄️  Checking for PostgreSQL database..."
echo ""
echo "Please ensure you have added a PostgreSQL database to your Railway project:"
echo "  1. Go to Railway dashboard"
echo "  2. Click '+ New'"
echo "  3. Select 'Database' → 'PostgreSQL'"
echo "  4. Wait for deployment"
echo ""
read -p "Have you added PostgreSQL? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please add PostgreSQL database first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL confirmed${NC}"
echo ""

# Set environment variables
echo "🔧 Setting environment variables..."
echo ""
echo "Setting NODE_ENV=production..."
railway variables --set NODE_ENV=production

echo ""
echo -e "${YELLOW}⚠️  Important: Set DATABASE_URL in Railway dashboard${NC}"
echo "  1. Go to your Railway project"
echo "  2. Click on PostgreSQL database"
echo "  3. Copy the 'DATABASE_URL' connection string"
echo "  4. Go to your service → Variables"
echo "  5. Add variable: DATABASE_URL=<connection_string>"
echo ""
read -p "Press Enter when DATABASE_URL is set..." 

# Build check
echo ""
echo "🔨 Testing build locally..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed - please fix errors before deploying${NC}"
    exit 1
fi

echo ""
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "⏳ Waiting for deployment..."
sleep 5

# Run migrations
echo ""
echo "📊 Running database migrations..."
railway run npx prisma migrate deploy

echo ""
echo "🌱 Seeding database..."
read -p "Do you want to seed the production database with test data? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    railway run npx prisma db seed
    echo -e "${GREEN}✅ Database seeded${NC}"
else
    echo "Skipping seed data"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Your Application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get deployment URL
DEPLOY_URL=$(railway status 2>/dev/null | grep -o 'https://[^[:space:]]*' || echo "Check Railway dashboard")
echo "  URL: $DEPLOY_URL"
echo ""

echo "🔑 Test Accounts (if seeded):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  User:    user1@fishing.com / 123456@$"
echo "  Manager: manager1@fishing.com / 123456@$"
echo "  Admin:   admin@fishing.com / 123456@$"
echo ""

echo "📊 Useful Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  View logs:       railway logs"
echo "  Open dashboard:  railway open"
echo "  Run command:     railway run <command>"
echo "  Check status:    railway status"
echo ""

echo "🎯 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Visit your application URL"
echo "  2. Test login with seed accounts"
echo "  3. Verify all features work"
echo "  4. Monitor logs: railway logs -f"
echo "  5. Set up custom domain (optional)"
echo ""

echo "Happy Fishing! 🎣"
