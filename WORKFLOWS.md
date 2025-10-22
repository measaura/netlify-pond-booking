# 🎣 Pond Booking System - Visual Workflows

## 📱 User Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER JOURNEY                               │
└─────────────────────────────────────────────────────────────────┘

1. DISCOVERY
   ┌─────────────┐
   │  Homepage   │  → Browse available ponds
   │   /book     │  → View pond details (capacity, pricing, shape)
   └──────┬──────┘
          │
          ▼
2. BOOKING
   ┌─────────────────┐
   │  Pond Details   │  → Select date from calendar
   │/booking/[id]    │  → Choose time slot
   └────────┬────────┘  → Confirm booking
            │
            ▼
3. CONFIRMATION
   ┌─────────────┐
   │   Ticket    │  → Receive QR code
   │  /ticket    │  → Booking details
   └──────┬──────┘  → Check-in instructions
          │
          ▼
4. CHECK-IN
   ┌─────────────┐
   │  At Pond    │  → Manager scans QR
   │ (Physical)  │  → Rod assignment
   └──────┬──────┘  → Start fishing
          │
          ▼
5. FISHING
   ┌─────────────┐
   │  Catch Fish │  → Staff records catch
   │ (Rod QR)    │  → Weight + species logged
   └──────┬──────┘  → Leaderboard updates
          │
          ▼
6. LEADERBOARD
   ┌─────────────┐
   │ Rankings    │  → View position
   │/leaderboard │  → See top catches
   └─────────────┘  → Track prizes
```

---

## 👔 Manager Workflows

```
┌─────────────────────────────────────────────────────────────────┐
│                    MANAGER DASHBOARD                            │
└─────────────────────────────────────────────────────────────────┘

DAILY OPERATIONS FLOW:

Morning Setup
   ┌──────────────┐
   │  Dashboard   │  → Check today's bookings
   │  /manager    │  → Review pond status
   └──────┬───────┘  → Prepare equipment
          │
          ▼
Check-In Period
   ┌──────────────────┐
   │ Dedicated Scanner│  → Scan booking QR codes
   │/dedicated-scanner│  → Assign rod QR codes
   └────────┬─────────┘  → Record check-ins
            │
            ▼
Active Fishing
   ┌──────────────┐
   │   Monitor    │  → Real-time occupancy
   │  /monitor    │  → Current check-ins
   └──────┬───────┘  → Pond status
          │
          ▼
Catch Recording
   ┌──────────────────┐
   │ Scanner - Catch  │  → Scan rod QR
   │     Tab          │  → Enter weight/length
   └────────┬─────────┘  → Submit to system
            │
            ▼
Check-Out Period
   ┌──────────────────┐
   │ Scanner - Checkout│ → Scan booking QR
   │      Tab         │  → Record departure
   └────────┬─────────┘  → Return equipment
            │
            ▼
End of Day
   ┌──────────────┐
   │   Reports    │  → Revenue analysis
   │  /reports    │  → Attendance stats
   └──────────────┘  → Export data
```

---

## 🔧 Admin Configuration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  SYSTEM SETUP (ONE-TIME)                        │
└─────────────────────────────────────────────────────────────────┘

1. POND SETUP
   ┌───────────────┐
   │ Create Pond   │
   │/admin/ponds   │
   └───────┬───────┘
           │
           ├─> Name, location
           ├─> Capacity, pricing
           ├─> Shape (circular/rectangular)
           └─> Enable/disable
           
2. TIME SLOT CONFIG
   ┌───────────────┐
   │ Time Slots    │
   │ (per pond)    │
   └───────┬───────┘
           │
           ├─> Start/end times
           ├─> Duration
           └─> Max bookings per slot

3. EVENT CREATION
   ┌───────────────┐
   │ Create Event  │
   │/admin/events  │
   └───────┬───────┘
           │
           ├─> Event date/time
           ├─> Linked pond
           ├─> Max participants
           └─> Registration cutoff

4. GAME SETUP
   ┌───────────────┐
   │Configure Game │
   │/admin/games   │
   └───────┬───────┘
           │
           ├─> Game type
           ├─> Prize pool
           ├─> Start/end date
           └─> Rules

5. USER MANAGEMENT
   ┌───────────────┐
   │  Add Users    │
   │/admin/users   │
   └───────┬───────┘
           │
           ├─> Create accounts
           ├─> Assign roles
           └─> Manage permissions
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       DATA FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

USER ACTION → API ENDPOINT → DATABASE → RESPONSE

Example: Create Booking
─────────────────────────

[User]                [Frontend]           [API Route]         [Database]
  │                       │                     │                  │
  │ Select date/time      │                     │                  │
  ├──────────────────────>│                     │                  │
  │                       │ POST /api/bookings  │                  │
  │                       ├────────────────────>│                  │
  │                       │                     │ Check availability
  │                       │                     ├─────────────────>│
  │                       │                     │<─────────────────┤
  │                       │                     │ Create booking   │
  │                       │                     ├─────────────────>│
  │                       │                     │ Generate QR      │
  │                       │                     ├─────────────────>│
  │                       │                     │ Create seat      │
  │                       │                     ├─────────────────>│
  │                       │<────────────────────┤                  │
  │<──────────────────────┤ Booking confirmed   │                  │
  │ Show ticket with QR   │                     │                  │


Example: Record Catch
──────────────────────

[Manager]             [Scanner]           [API Route]         [Database]
  │                       │                     │                  │
  │ Scan rod QR           │                     │                  │
  ├──────────────────────>│                     │                  │
  │ Enter weight/species  │                     │                  │
  ├──────────────────────>│                     │                  │
  │                       │ POST /api/catches   │                  │
  │                       ├────────────────────>│                  │
  │                       │                     │ Validate rod     │
  │                       │                     ├─────────────────>│
  │                       │                     │ Create catch     │
  │                       │                     ├─────────────────>│
  │                       │                     │ Update leaderboard
  │                       │                     ├─────────────────>│
  │                       │<────────────────────┤                  │
  │<──────────────────────┤ Catch recorded      │                  │
  │                       │                     │                  │
```

---

## 🎯 QR Code Workflows

```
┌─────────────────────────────────────────────────────────────────┐
│                    QR CODE SYSTEM                               │
└─────────────────────────────────────────────────────────────────┘

TWO TYPES OF QR CODES:

1. BOOKING QR CODE (for check-in/check-out)
   ┌─────────────────┐
   │  Generated at   │  → Unique per booking seat
   │  Booking Time   │  → Contains: bookingId + seatId
   └────────┬────────┘  → Used for entry/exit
            │
            ├─> Check-in: Records entry time
            ├─> Check-out: Records exit time
            └─> Validates: Correct date/time


2. ROD QR CODE (for catch recording)
   ┌─────────────────┐
   │  Pre-generated  │  → Unique per fishing rod
   │  System QR      │  → Contains: rodId
   └────────┬────────┘  → Linked to user at check-in
            │
            ├─> Links: Rod → Booking → User
            ├─> Records: Each catch with rod
            └─> Updates: Leaderboard automatically


SCANNER WORKFLOWS:

User Scanner (/scanner)
   ┌─────────────────────┐
   │  Simple Interface   │
   │  - Check-in         │  → Scan booking QR
   │  - Check-out        │  → Record time
   │  - Catch (basic)    │  → Scan rod QR
   └─────────────────────┘

Manager Scanner (/dedicated-scanner)
   ┌─────────────────────┐
   │  Advanced Interface │
   │  Tab 1: Check-in    │  → Scan booking QR
   │  Tab 2: Check-out   │  → Scan booking QR
   │  Tab 3: Catch       │  → Scan rod QR
   │        Recording    │  → Enter details
   └─────────────────────┘  → Submit with species/weight
```

---

## 🏆 Leaderboard System

```
┌─────────────────────────────────────────────────────────────────┐
│                   LEADERBOARD MECHANICS                         │
└─────────────────────────────────────────────────────────────────┘

CATCH RECORDING FLOW:
   ┌─────────────┐
   │ Catch Fish  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────────┐
   │ Staff Scans Rod │  1. Scan rod QR code
   │      QR         │  2. Get rod details
   └────────┬────────┘  3. Find linked user
            │
            ▼
   ┌─────────────────┐
   │ Enter Details   │  → Weight (kg)
   │                 │  → Length (cm)
   └────────┬────────┘  → Species
            │
            ▼
   ┌─────────────────┐
   │ API Processes   │  1. Create CatchRecord
   │                 │  2. Link to CheckInRecord
   └────────┬────────┘  3. Update LeaderboardEntry
            │
            ▼
   ┌─────────────────┐
   │ Leaderboard     │  → Sort by total weight
   │    Updates      │  → Rank users
   └────────┬────────┘  → Calculate prizes
            │
            ▼
   ┌─────────────────┐
   │ User Views      │  → See updated rank
   │  /leaderboard   │  → View catches
   └─────────────────┘  → Track progress


RANKING CALCULATION:
   Rank = SUM(catch weights) for each user
   Tie-breaker = Largest single catch
   Time period = Game start/end dates
```

---

## 🔄 Database Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                  ENTITY RELATIONSHIPS                           │
└─────────────────────────────────────────────────────────────────┘

User
 ├─> Bookings (1:many)
 ├─> CheckInRecords (1:many)
 ├─> CatchRecords (1:many)
 ├─> LeaderboardEntries (1:many)
 └─> Notifications (1:many)

Pond
 ├─> TimeSlots (1:many)
 ├─> Bookings (1:many)
 ├─> Events (1:many)
 └─> CheckInRecords (1:many)

Booking
 ├─> BookingSeats (1:many) ← [QR codes generated]
 ├─> CheckInRecords (1:many)
 └─> User (many:1)

BookingSeat
 ├─> QR Code (unique)
 ├─> CheckInRecords (1:1)
 └─> Booking (many:1)

FishingRod
 ├─> QR Code (unique)
 ├─> CatchRecords (1:many)
 └─> CheckInRecords (1:many) [assignment]

CheckInRecord
 ├─> User (many:1)
 ├─> BookingSeat (1:1)
 ├─> FishingRod (many:1)
 ├─> CatchRecords (1:many)
 └─> WeighingRecords (1:many)

CatchRecord
 ├─> CheckInRecord (many:1)
 ├─> FishingRod (many:1)
 └─> LeaderboardEntry (many:1)

Game
 ├─> LeaderboardEntries (1:many)
 └─> Prize configuration

Event
 ├─> Pond (many:1)
 └─> Bookings (1:many)
```

---

## 📱 Screen Navigation Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    NAVIGATION STRUCTURE                         │
└─────────────────────────────────────────────────────────────────┘

PUBLIC ROUTES (No login required)
   /                → Homepage
   /login           → Authentication

USER ROUTES (Authenticated)
   /dashboard       → User dashboard
   /book            → Browse ponds
   /booking/[id]    → Book specific pond
   /event-booking/[id] → Register for event
   /ticket          → View booking ticket + QR
   /bookings        → Booking history
   /scanner         → QR scanner
   /leaderboard     → Competition rankings
   /profile         → Account settings
   /notifications   → User alerts

MANAGER ROUTES (Manager role)
   /manager/dashboard    → Manager overview
   /manager/monitor      → Real-time status
   /manager/bookings/*   → Booking management
   /dedicated-scanner    → Advanced scanner
   /manager/leaderboard  → Full standings
   /manager/reports      → Analytics

ADMIN ROUTES (Admin role)
   /admin/dashboard      → System overview
   /admin/users          → User management
   /admin/ponds          → Pond CRUD
   /admin/events         → Event management
   /admin/games          → Game configuration
   /admin/prizes         → Prize settings
   /admin/analytics      → Advanced metrics
   /admin/settings       → System config
   /admin/control        → System controls
   /admin/status         → System status
   /admin/alerts         → System alerts
   /admin/database       → Database viewer
```

---

## 🎨 Toast Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              TOAST NOTIFICATION SYSTEM                          │
└─────────────────────────────────────────────────────────────────┘

OLD SYSTEM (window.alert)
   ┌──────────────┐
   │  Action      │
   │  Completes   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │window.alert()│  ❌ BLOCKS UI
   │ "Success!"   │  ❌ Requires click to dismiss
   └──────┬───────┘  ❌ No styling options
          │          ❌ Only one at a time
          │
          ▼
   [User clicks OK]
   
NEW SYSTEM (Toast)
   ┌──────────────┐
   │  Action      │
   │  Completes   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │toast.push()  │  ✅ Non-blocking
   │ {message,    │  ✅ Auto-dismiss
   │  variant}    │  ✅ Styled (success/error/info)
   └──────┬───────┘  ✅ Multiple toasts stack
          │
          │ (UI continues)
          │
          ▼
   [Toast appears in corner]
   [Auto-dismisses after 3s]


USAGE IN CODE:

const toast = useToastSafe()

// Success notification
toast?.push({ 
  message: 'Booking created successfully!', 
  variant: 'success' 
})

// Error notification
toast?.push({ 
  message: 'Failed to save changes', 
  variant: 'destructive' 
})

// Info notification (default)
toast?.push({ 
  message: 'Processing your request...' 
})
```

---

## 🎯 Testing Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING CHECKLIST                            │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: Setup
   ✅ Run ./scripts/setup-local-db.sh
   ✅ Verify PostgreSQL running
   ✅ Check seed data loaded
   ✅ Start dev server (npm run dev)

PHASE 2: User Testing
   ✅ Login as user1@fishing.com
   ✅ Browse ponds
   ✅ Create booking
   ✅ View ticket with QR
   ✅ Check leaderboard
   ✅ View booking history

PHASE 3: Manager Testing
   ✅ Login as manager1@fishing.com
   ✅ Check dashboard metrics
   ✅ Use scanner to check-in user
   ✅ Record a catch
   ✅ View real-time monitor
   ✅ Generate reports

PHASE 4: Admin Testing
   ✅ Login as admin@fishing.com
   ✅ Create new pond
   ✅ Set up event
   ✅ Configure game
   ✅ Manage users
   ✅ View analytics

PHASE 5: Integration Testing
   ✅ Complete booking → check-in → catch → leaderboard flow
   ✅ Verify toast notifications work
   ✅ Test QR scanning (camera + manual)
   ✅ Check data consistency in Prisma Studio
   ✅ Verify no console errors

PHASE 6: Production Prep
   ✅ Run npm run build (no errors)
   ✅ Run npm run lint (clean)
   ✅ Deploy to Railway
   ✅ Test production with real data
   ✅ Monitor Railway logs
```

---

**For detailed testing instructions, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)**
