# Railway Deployment Configuration

## Environment Variables Required in Railway Dashboard

Set these in your Railway project's **Variables** tab:

```bash
DATABASE_URL=postgresql://postgres:PjOpTiGYjXyFSfPNFYpGfGQUKnOSwYLI@maglev.proxy.rlwy.net:59727/railway
NEXTAUTH_SECRET=your-super-secret-auth-key-change-this-in-production-at-least-32-chars
NEXTAUTH_URL=https://your-railway-app-name.up.railway.app
NODE_ENV=production
```

## Database Setup Commands

### 1. Initial Schema Deployment (First Time Only)
```bash
# Deploy schema to Railway database
DATABASE_URL="postgresql://postgres:PjOpTiGYjXyFSfPNFYpGfGQUKnOSwYLI@maglev.proxy.rlwy.net:59727/railway" npx prisma db push --force-reset

# Seed Railway database with initial data
DATABASE_URL="postgresql://postgres:PjOpTiGYjXyFSfPNFYpGfGQUKnOSwYLI@maglev.proxy.rlwy.net:59727/railway" npx prisma db seed
```

### 2. Regular Updates
```bash
# Push schema changes (when you modify schema.prisma)
DATABASE_URL="postgresql://postgres:PjOpTiGYjXyFSfPNFYpGfGQUKnOSwYLI@maglev.proxy.rlwy.net:59727/railway" npx prisma db push

# Re-seed if needed
DATABASE_URL="postgresql://postgres:PjOpTiGYjXyFSfPNFYpGfGQUKnOSwYLI@maglev.proxy.rlwy.net:59727/railway" npx prisma db seed
```

### 3. Using Helper Scripts
```bash
# Use the Railway sync utility
./scripts/railway-db-sync.sh

# Options available:
# 1) Check Railway connection
# 2) Deploy migrations to Railway  
# 3) Sync schema to Railway (db push)
# 4) Seed Railway database
# 5) Reset Railway database (DANGEROUS)
# 6) Create Railway backup
# 7) Compare local vs Railway schemas
# 8) Full sync (deploy + seed)
```

## Railway Deployment Process

1. **Push your code to GitHub** (already done)
2. **Configure environment variables** in Railway dashboard
3. **Deploy** - Railway will automatically:
   - Install dependencies
   - Generate Prisma client
   - Build Next.js app
   - Start the application

4. **First deployment database setup:**
   - Railway doesn't automatically run migrations
   - Use the sync script or manual commands above
   - Verify the app works at your Railway URL

## Local Development with Railway Database

To switch your local development to use Railway database:

```bash
# Backup current .env
cp .env .env.local.backup

# Use Railway database locally
cp .env.railway .env

# Switch back to local database
cp .env.local.backup .env
```

## Status

✅ Railway database connection: WORKING
✅ Schema deployed to Railway: COMPLETE
✅ Initial data seeded: COMPLETE
✅ Database sync scripts: READY

## Next Steps

1. Set environment variables in Railway dashboard
2. Deploy from Railway dashboard
3. Your app should be live and working!

## Database Contents (Railway)

The Railway database now contains:
- 4+ ponds with proper capacity and shape settings
- 1 admin, 1 manager, 5 regular users
- 2 open events (bookable) with multiple games and rank-based prizes
- 20 achievements across 6 categories
- User stats initialized for all users
- Sample bookings for tomorrow (ponds available today!)
- 7 sample catch records for leaderboard testing