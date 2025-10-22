# 🎣 Complete Testing & Deployment Guide

## 📋 Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Database Setup](#database-setup)
3. [Testing All Features](#testing-all-features)
4. [Railway Deployment](#railway-deployment)
5. [Troubleshooting](#troubleshooting)

---

## 🏠 Local Development Setup

### Prerequisites
- Node.js 18+ (or Bun)
- PostgreSQL 14+ installed locally
- Git

### Step 1: Install PostgreSQL Locally

#### macOS (using Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Verify installation
psql --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Download and install from [PostgreSQL.org](https://www.postgresql.org/download/windows/)

### Step 2: Create Local Database

```bash
# Connect to PostgreSQL
psql postgres

# Inside psql:
CREATE DATABASE pond_booking_local;
CREATE USER pond_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE pond_booking_local TO pond_admin;

# For Postgres 15+, also grant schema privileges:
\c pond_booking_local
GRANT ALL ON SCHEMA public TO pond_admin;

# Exit psql
\q
```

### Step 3: Clone & Install Dependencies

```bash
# If not already cloned
cd /Users/scwmbp/Development/netlify-pond-booking

# Install dependencies
npm install
# or
bun install
```

### Step 4: Configure Environment Variables

```bash
# Create .env file from example
cp .env.example .env

# Edit .env file
nano .env
```

Update `.env` with your local database:
```bash
# Local Development
DATABASE_URL="postgresql://pond_admin:your_secure_password@localhost:5432/pond_booking_local"

# Railway Production (will be set later)
RAILWAY_DATABASE_URL=""
```

### Step 5: Initialize Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# View your database structure
npx prisma studio
# Opens http://localhost:5555 for GUI database browser
```

### Step 6: Seed Database with Test Data

```bash
# Run the seed script to populate with test data
npx prisma db seed

# This will create:
# - Test users (user, manager, admin)
# - Sample ponds
# - Sample events
# - Time slots
# - Games and prizes
```

### Step 7: Start Development Server

```bash
# Start Next.js dev server
npm run dev
# or
bun dev

# Server will start at http://localhost:3000
```

---

## 🗄️ Database Setup Details

### Database Schema Overview

Our Prisma schema includes:
- **Users**: Multi-role system (USER, MANAGER, ADMIN)
- **Ponds**: Fishing ponds with seating arrangements
- **Events**: Competition events with games
- **Bookings**: Both pond bookings and event registrations
- **BookingSeats**: Individual seat assignments with QR codes
- **FishingRods**: QR-coded fishing rods
- **CheckInRecords**: Check-in/out tracking
- **WeighingRecords**: Official catch weighing
- **CatchRecords**: Fish catch data
- **LeaderboardEntries**: Competition rankings
- **Notifications**: User notifications

### Verify Database Setup

```bash
# Check database connection
npx prisma db pull

# View current migrations
npx prisma migrate status

# Browse database GUI
npx prisma studio
```

---

## 🧪 Testing All Features

### Test Accounts (created by seed script)

| Role    | Email                    | Password   | Access Level              |
|---------|--------------------------|------------|---------------------------|
| User    | user1@fishing.com        | 123456@$   | Basic booking & events    |
| User    | user2@fishing.com        | 123456@$   | Basic booking & events    |
| Manager | manager1@fishing.com     | 123456@$   | Pond management, scanning |
| Admin   | admin@fishing.com        | 123456@$   | Full system access        |

### 1. Authentication Testing

#### Login Flow
1. Navigate to `http://localhost:3000`
2. You'll be redirected to `/login`
3. Try logging in with each role:
   ```
   Email: user1@fishing.com
   Password: 123456@$
   ```

#### Expected Behavior
- **User**: Redirects to `/dashboard`
- **Manager**: Redirects to `/manager/dashboard`
- **Admin**: Redirects to `/admin/dashboard`

#### Test Cases
- ✅ Login with valid credentials
- ✅ Login with invalid credentials (should show error)
- ✅ Logout functionality
- ✅ Role-based redirect

---

### 2. User Features Testing (Login as `user1@fishing.com`)

#### Dashboard (`/dashboard`)
- ✅ View personal stats
- ✅ See upcoming bookings
- ✅ View leaderboard preview
- ✅ Recent activity

#### Book Ponds (`/book` → Ponds Tab)
1. Click on a pond card
2. Select a date
3. Choose time slot
4. Select seats (visual seat selector)
5. Confirm booking
6. **Expected**: See confirmation with QR code

#### Book Events (`/book` → Events Tab)
1. Click on an upcoming event
2. Select available seat
3. Confirm registration
4. **Expected**: Event booking with seat assignment

#### My Bookings (`/bookings`)
- ✅ View all bookings (upcoming & past)
- ✅ See booking details
- ✅ View QR codes for check-in
- ✅ Delete/cancel bookings
- ✅ Filter by status

#### Ticket/QR Code (`/ticket?booking=<id>`)
- ✅ Display booking QR code
- ✅ Show booking details
- ✅ Download QR code
- ✅ Share booking

#### Leaderboard (`/leaderboard`)
- ✅ View competition rankings
- ✅ See top 3 podium
- ✅ View detailed standings
- ✅ Filter by event

#### Fishing Journey (`/journey`)
- ✅ View achievements
- ✅ See statistics
- ✅ View competition history
- ✅ Track progress

#### Notifications (`/notifications`)
- ✅ View all notifications
- ✅ Mark as read
- ✅ Click to see details
- ✅ Unread count badge

---

### 3. Manager Features Testing (Login as `manager1@fishing.com`)

#### Manager Dashboard (`/manager/dashboard`)
- ✅ View today's statistics
- ✅ Current check-ins
- ✅ Active ponds status
- ✅ Quick actions

#### QR Scanner (`/scanner`)
**Testing Check-in Flow:**
1. Generate test QR code first:
   - Go to `/test-generator`
   - Select a booking
   - Generate QR code
2. Go to `/scanner`
3. Click "Start Scanner"
4. Show QR code to camera or upload image
5. **Expected**: Check-in confirmation dialog

**Testing Check-out Flow:**
1. Use same QR code from check-in
2. Scanner detects already checked-in status
3. Shows check-out option
4. **Expected**: Check-out confirmation

#### Dedicated Scanner (`/dedicated-scanner`)
**Multi-Function Scanner with Tabs:**
- **Check-in Tab**: Scan booking QR for check-in
- **Check-out Tab**: Scan booking QR for check-out
- **Catch Recording Tab**: 
  1. Scan rod QR code
  2. Enter weight, length, species
  3. Submit catch record

#### Monitor (`/manager/monitor`)
- ✅ Real-time pond status
- ✅ Current occupancy
- ✅ Today's bookings by pond
- ✅ Live check-in updates

#### Bookings Management
- **Pond Bookings** (`/manager/bookings/pond/[pondId]`)
  - ✅ View all bookings for specific pond
  - ✅ Check booking details
  - ✅ Cancel bookings
  
- **Event Bookings** (`/manager/bookings/event/[eventId]`)
  - ✅ View event participants
  - ✅ Check seat assignments
  - ✅ Manage registrations

#### Leaderboard (`/manager/leaderboard`)
- ✅ View full competition standings
- ✅ Real-time updates
- ✅ Export data

#### Reports (`/manager/reports`)
- ✅ Business analytics
- ✅ Revenue reports
- ✅ Attendance statistics
- ✅ Export functionality

---

### 4. Admin Features Testing (Login as `admin@fishing.com`)

#### Admin Dashboard (`/admin/dashboard`)
- ✅ System overview
- ✅ User statistics
- ✅ Revenue metrics
- ✅ System health

#### User Management (`/admin/users`)
**Test Cases:**
1. View all users
2. Change user roles (User ↔ Manager ↔ Admin)
3. Activate/deactivate users
4. View user statistics
5. **Expected**: Role changes take effect immediately

#### Pond Management (`/admin/ponds`)
**Test Cases:**
1. **Create New Pond:**
   - Click "+ Add Pond"
   - Fill in details (name, capacity, price)
   - Select shape (Rectangle/Circle/Square)
   - Set seating arrangement
   - **Expected**: New pond appears in list

2. **Edit Pond:**
   - Click edit button
   - Modify capacity or price
   - Save changes
   - **Expected**: Changes persist

3. **Toggle Booking Status:**
   - Enable/disable booking
   - **Expected**: Status updates in real-time

4. **Delete Pond:**
   - Click delete
   - Confirm deletion
   - **Expected**: Pond removed (if no bookings)

#### Event Management (`/admin/events`)
**Test Cases:**
1. **Create New Event:**
   - Click "+ Add Event"
   - Set name, date, time range
   - Set entry fee
   - Select assigned ponds
   - Add games (TARGET_WEIGHT, EXACT_WEIGHT, etc.)
   - **Expected**: Event created with games

2. **Manage Event Status:**
   - Change status: Upcoming → Open → Active → Completed
   - **Expected**: Status affects booking availability

3. **Add Games to Event:**
   - Click "Add Game"
   - Select game type
   - Set target weight (if applicable)
   - **Expected**: Game added to event

#### Game Configuration (`/admin/games`)
- ✅ Create game types
- ✅ Set rules and parameters
- ✅ Assign to events
- ✅ Activate/deactivate games

#### Prize Management (`/admin/prizes`)
- ✅ Create prize tiers
- ✅ Set prize amounts
- ✅ Assign to games
- ✅ Manage prize distribution

#### Status Monitor (`/admin/status`)
- ✅ System health check
- ✅ Today's bookings
- ✅ Active users
- ✅ Revenue overview

#### Analytics (`/admin/analytics`)
- ✅ Detailed statistics
- ✅ Revenue analysis
- ✅ User engagement
- ✅ Booking trends

#### Control Panel (`/admin/control`)
- ✅ System controls
- ✅ Database refresh
- ✅ Emergency shutdown
- ✅ Maintenance mode

#### Database Utils (`/admin/database`)
- ✅ Database status
- ✅ Reset database
- ✅ Sample data generation
- ✅ Backup/restore

---

### 5. Testing QR Code Workflow

#### Complete Flow Test:
1. **As User**: Create pond booking → Generate QR
2. **As Manager**: 
   - Scan QR for check-in
   - Print fishing rod QR
3. **At Pond**: User fishes, catches fish
4. **At Weighing Station**:
   - Scan rod QR
   - Enter weight details
   - Record catch
5. **Leaderboard**: Updates automatically
6. **Check-out**: Scan QR again to check out

---

### 6. Testing Toast Notifications (New Feature! ✨)

Our recent migration replaced all blocking `alert()` calls with smooth toast notifications.

**Test in these scenarios:**
1. **Successful Actions:**
   - Create booking → "Booking created successfully!" (green)
   - Check-in user → "Check-in successful!" (green)
   - Record catch → "Catch recorded successfully!" (green)

2. **Error Handling:**
   - Invalid login → Error toast (red)
   - Failed booking → Error toast (red)
   - Network error → Error toast (red)

3. **Info Messages:**
   - Feature not implemented → Info toast (blue)

**Expected Behavior:**
- ✅ Non-blocking (doesn't stop user interaction)
- ✅ Auto-dismisses after 3-5 seconds
- ✅ Can be manually dismissed
- ✅ Multiple toasts stack properly
- ✅ Fallback to `window.alert()` if toast not available

---

## 🚂 Railway Deployment

### Prerequisites
- Railway account ([railway.app](https://railway.app))
- GitHub repository connected

### Step 1: Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init
```

### Step 2: Add PostgreSQL Database

1. Go to Railway dashboard
2. Click "New Project"
3. Click "+ New"
4. Select "Database" → "PostgreSQL"
5. Wait for deployment
6. Copy connection string

### Step 3: Configure Environment Variables

In Railway Dashboard:
1. Go to your project
2. Click on your service
3. Go to "Variables" tab
4. Add:
   ```
   DATABASE_URL=<your_railway_postgres_url>
   NODE_ENV=production
   ```

### Step 4: Deploy Application

#### Option A: Automated Deployment Script (Recommended) 🚀
```bash
# Make script executable and run
chmod +x scripts/deploy-railway.sh
./scripts/deploy-railway.sh
```

**The script will:**
- ✅ Check Railway CLI installation
- ✅ Authenticate if needed
- ✅ Link or create project
- ✅ Guide you through PostgreSQL setup
- ✅ Run local build verification
- ✅ Deploy to Railway
- ✅ Run migrations
- ✅ Optionally seed database
- ✅ Display deployment URL and test accounts

#### Option B: GitHub Integration
1. Connect your GitHub repository
2. Railway auto-deploys on push
3. Select branch: `main` or `feature/alert-to-toast`
4. Add environment variables in Railway dashboard

#### Option C: Manual Railway CLI
```bash
# Link to Railway project
railway link

# Deploy
railway up

# Run migrations
railway run npx prisma migrate deploy

# Seed database (optional)
railway run npx prisma db seed
```

### Step 6: Verify Deployment

1. Check Railway logs
2. Visit your deployed URL
3. Test login with seed accounts
4. Verify database connectivity

---

## 🔧 Troubleshooting

### Issue: Database Connection Failed

**Solution:**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Regenerate Prisma Client
npx prisma generate
```

### Issue: Migrations Failed

**Solution:**
```bash
# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name fix_issue
```

### Issue: Seed Script Errors

**Solution:**
```bash
# Check seed file
cat prisma/seed.ts

# Run with detailed output
npx prisma db seed --preview-feature
```

### Issue: Port Already in Use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

### Issue: Toast Notifications Not Working

**Solution:**
1. Check browser console for errors
2. Verify `useToastSafe` hook is imported
3. Check `components/ui/toast.tsx` exists
4. Toast should fallback to `window.alert()` if unavailable

### Issue: QR Scanner Not Working

**Solution:**
1. Ensure HTTPS (required for camera access)
2. Grant camera permissions in browser
3. Test with image upload as alternative
4. Check browser compatibility (Chrome/Edge recommended)

---

## 📊 Database Management

### View Database in GUI

```bash
# Open Prisma Studio
npx prisma studio
# Visit http://localhost:5555
```

### Backup Database

```bash
# Local PostgreSQL backup
pg_dump -U pond_admin pond_booking_local > backup.sql

# Restore backup
psql -U pond_admin pond_booking_local < backup.sql
```

### Reset Database (Development Only)

```bash
# ⚠️ WARNING: This deletes all data
npx prisma migrate reset
npx prisma db seed
```

---

## 🎯 Quick Start Checklist

- [ ] PostgreSQL installed and running
- [ ] Local database created
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Migrations applied (`npx prisma migrate dev`)
- [ ] Database seeded (`npx prisma db seed`)
- [ ] Dev server running (`npm run dev`)
- [ ] Test accounts working
- [ ] QR scanner tested (with camera permission)
- [ ] Toast notifications verified
- [ ] Railway project created (for deployment)
- [ ] Production database configured
- [ ] App deployed and accessible

---

## 🚀 Next Steps

1. **Test Thoroughly**: Go through all user flows
2. **Check Mobile**: Test on mobile devices
3. **Performance**: Monitor response times
4. **Security**: Review authentication flows
5. **Documentation**: Keep this guide updated

---

## 📞 Support

For issues or questions:
- Check existing GitHub issues
- Review Prisma docs: https://www.prisma.io/docs
- Railway docs: https://docs.railway.app
- Next.js docs: https://nextjs.org/docs

---

**Happy Testing! 🎣**
