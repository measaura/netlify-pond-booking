# 🚀 Quick Start Guide

## Local Development (5 Minutes)

### 1. Setup Database
```bash
chmod +x scripts/setup-local-db.sh
./scripts/setup-local-db.sh
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access Application
- **URL**: http://localhost:3000
- **Admin**: admin@fishing.com / 123456@$
- **Manager**: manager1@fishing.com / 123456@$
- **User**: user1@fishing.com / 123456@$

---

## Railway Deployment (5 Minutes)

### Quick Deploy
```bash
chmod +x scripts/deploy-railway.sh
./scripts/deploy-railway.sh
```

Follow the interactive prompts - the script handles everything!

---

## Test Accounts

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@fishing.com | 123456@$ | Full system control |
| **Manager** | manager1@fishing.com | 123456@$ | Pond management, bookings |
| **User** | user1@fishing.com | 123456@$ | Book, scan, leaderboard |

---

## Key Features to Test

### 👤 User Features
- ✅ Browse ponds (`/book`)
- ✅ Create booking
- ✅ View ticket with QR code (`/ticket`)
- ✅ Scan QR at check-in (`/scanner`)
- ✅ Record catches
- ✅ Check leaderboard (`/leaderboard`)

### 👔 Manager Features
- ✅ Monitor real-time status (`/manager/monitor`)
- ✅ Manage bookings
- ✅ View reports
- ✅ Use dedicated scanner (`/dedicated-scanner`)

### 🔧 Admin Features
- ✅ Create ponds (`/admin/ponds`)
- ✅ Set up events (`/admin/events`)
- ✅ Configure games (`/admin/games`)
- ✅ Manage users (`/admin/users`)
- ✅ View analytics (`/admin/analytics`)

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint

# Database
npx prisma studio        # Open Prisma Studio GUI
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create new migration
npx prisma db seed       # Seed database

# Railway
railway logs             # View deployment logs
railway logs -f          # Follow logs live
railway open             # Open Railway dashboard
railway status           # Check deployment status
```

---

## Project Structure

```
app/                    # Next.js App Router pages
├── admin/             # Admin panel (ponds, events, games)
├── manager/           # Manager dashboard (bookings, reports)
├── api/               # API routes (bookings, checkins, catches)
├── book/              # Pond booking interface
├── scanner/           # QR code scanner
└── leaderboard/       # Competition rankings

components/            # React components
├── ui/               # UI components (toast, calendar, etc.)
└── *Navigation.tsx   # Navigation bars

prisma/               # Database schema & migrations
lib/                  # Utilities (auth, API clients)
scripts/              # Automation scripts
```

---

## Toast System

The alert-to-toast migration provides better UX:

```typescript
import { useToastSafe } from '@/components/ui/toast'

const toast = useToastSafe()

// Success
toast?.push({ message: 'Booking created!', variant: 'success' })

// Error
toast?.push({ message: 'Failed to save', variant: 'destructive' })

// Info (default)
toast?.push({ message: 'Processing...' })
```

---

## Need More Details?

📖 **See [TESTING_GUIDE.md](./TESTING_GUIDE.md)** for:
- Complete feature testing workflows
- Database schema details
- QR code scanning workflows
- Troubleshooting guide
- Production deployment details

---

## Support

- 📧 Issues: Create GitHub issue
- 📚 Docs: See TESTING_GUIDE.md
- 🐛 Bugs: Check Railway logs or browser console

---

**Happy Fishing! 🎣**
