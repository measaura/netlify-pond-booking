#!/bin/bash

# Railway Build Script
# This script runs during Railway deployment to set up the database

set -e

echo "🚂 Railway Build Script Starting..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Deploy database migrations
echo "🔄 Deploying database migrations..."
npx prisma migrate deploy

# Seed database if needed (uncomment if you want to seed on every deploy)
# echo "🌱 Seeding database..."
# npx prisma db seed

echo "✅ Railway build script completed successfully!"