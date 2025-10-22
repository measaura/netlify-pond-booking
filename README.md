# 🎣 Pond Booking System

A comprehensive fishing pond management and booking system built with Next.js 15, TypeScript, Prisma, and PostgreSQL.

## 🚀 Quick Start

**Get up and running in 5 minutes:**

```bash
# 1. Setup local PostgreSQL database
chmod +x scripts/setup-local-db.sh
./scripts/setup-local-db.sh

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Visit [localhost:3000](http://localhost:3000) and login:
- **Admin**: admin@fishing.com / 123456@$
- **Manager**: manager1@fishing.com / 123456@$
- **User**: user1@fishing.com / 123456@$

📖 **[See QUICK_START.md for detailed setup →](./QUICK_START.md)**

---

## ✨ Features

### 👤 User Features
- Browse and book fishing ponds
- Calendar-based availability
- QR code tickets for check-in
- Real-time leaderboard
- Catch recording
- Booking history

### 👔 Manager Features
- Real-time pond monitoring
- Booking management
- Dedicated QR scanner
- Business reports
- Attendance tracking

### 🔧 Admin Features
- Pond management (CRUD)
- Event creation
- Game configuration
- User management
- System analytics
- Prize settings

---

## 🏗️ Tech Stack

- **Framework**: Next.js 15.3.2 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: Custom JWT-based authentication
- **QR**: Real-time scanning for check-ins
- **Deployment**: Netlify (app) + Railway (database)

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | 5-minute setup guide |
| **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** | Complete testing workflows |
| **[SESSION_RECAP.md](./SESSION_RECAP.md)** | Development progress |

---

## 🗄️ Database Schema

The system uses 18+ database models:

- **Users**: Multi-role (User, Manager, Admin)
- **Ponds**: Fishing locations with capacity
- **Events**: Special fishing events
- **Bookings**: Time-slot based reservations
- **BookingSeats**: Individual seats with QR codes
- **FishingRods**: Rod tracking with QR codes
- **CheckInRecords**: Entry/exit tracking
- **CatchRecords**: Fish catches with weighing
- **LeaderboardEntry**: Competition rankings
- **Notifications**: User alerts

---

## 🚀 Deployment

### Local Development
```bash
./scripts/setup-local-db.sh  # Setup PostgreSQL
npm run dev                   # Start dev server
```

### Railway Production
```bash
./scripts/deploy-railway.sh  # Automated deployment
```

The deployment script handles:
- ✅ Railway CLI setup
- ✅ PostgreSQL configuration
- ✅ Environment variables
- ✅ Database migrations
- ✅ Optional seeding

📖 **[See TESTING_GUIDE.md for deployment details →](./TESTING_GUIDE.md)**

---

## 🧪 Testing

### Manual Testing
```bash
npm run dev              # Start dev server
npx prisma studio        # Open database GUI
```

### Test Accounts
- **Admin**: admin@fishing.com / 123456@$
- **Manager**: manager1@fishing.com / 123456@$
- **User**: user1@fishing.com / 123456@$

### Feature Testing
Test all 40+ pages across user/manager/admin interfaces.

📖 **[See TESTING_GUIDE.md for complete testing workflows →](./TESTING_GUIDE.md)**

---

## 🛠️ Development Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run lint             # Run ESLint

# Database
npx prisma studio        # GUI for database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create migration
npx prisma db seed       # Seed test data

# Deployment
./scripts/setup-local-db.sh     # Setup local PostgreSQL
./scripts/deploy-railway.sh     # Deploy to Railway
```

---

## 📁 Project Structure

```
app/                    # Next.js App Router
├── admin/             # Admin panel pages
├── manager/           # Manager dashboard
├── api/               # API routes
├── book/              # Booking interface
├── scanner/           # QR scanner
└── leaderboard/       # Rankings

components/            # React components
├── ui/               # UI components (toast, calendar)
└── *Navigation.tsx   # Navigation bars

prisma/               # Database
├── schema.prisma     # Database schema
├── migrations/       # Migration history
└── seed.ts           # Test data seeding

lib/                  # Utilities
├── auth.ts           # Authentication
├── db-functions.ts   # Database helpers
└── utils.ts          # Shared utilities

scripts/              # Automation
├── setup-local-db.sh    # PostgreSQL setup
└── deploy-railway.sh    # Railway deployment
```

---

## 🎯 Key Workflows

### Booking Flow
1. User browses ponds (`/book`)
2. Selects date and time slot
3. Completes booking
4. Receives QR code ticket

### Check-in Flow
1. User arrives at pond
2. Manager/staff scans QR code (`/scanner` or `/dedicated-scanner`)
3. System records check-in
4. Rod QR codes assigned

### Catch Recording
1. Staff scans rod QR code
2. Enters fish details (weight, length, species)
3. System updates leaderboard
4. User sees updated ranking

---

## 🔒 Authentication

Three user roles with different access levels:

| Role | Access |
|------|--------|
| **User** | Book ponds, view tickets, check leaderboard |
| **Manager** | + Manage bookings, scan QR, view reports |
| **Admin** | + Full system control, create ponds/events |

---

## 🎨 Toast System

Improved UX with toast notifications (migrated from window.alert):

```typescript
import { useToastSafe } from '@/components/ui/toast'

const toast = useToastSafe()

toast?.push({ 
  message: 'Booking created!', 
  variant: 'success' 
})
```

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -d pond_booking

# Reset database
npm run prisma:reset
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

📖 **[See TESTING_GUIDE.md for more troubleshooting →](./TESTING_GUIDE.md)**

---

## 📦 Environment Variables

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pond_booking"
JWT_SECRET="your-super-secret-jwt-key"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is private and proprietary.

---

**Happy Fishing! 🎣**
