# Seat Sharing & Check-In Flow Guide

## Complete User Journey for Event Bookings

### 📋 Overview
When a user books an event with multiple seats, they become the "booking leader" and must assign each seat to users (including themselves) before check-in. Each seat gets a unique QR code that's used for check-in at the event.

---

## 🎯 Step-by-Step Flow

### Step 1: Book Event Seats
**Location**: Event booking page  
**Action**: User books 1 or more seats for an event

**What Happens**:
- Booking is created with unique `bookingId` (e.g., "BK-EVT-001")
- Each seat gets:
  - Seat number (1, 2, 3, etc.)
  - Unique QR code (e.g., "BK-EVT-001_SEAT_1_1729876543210")
  - Status: "assigned" (initially unassigned)
- User becomes the booking leader

---

### Step 2: View Bookings
**Location**: `/bookings` page  
**What You See**: 
- "Upcoming" tab shows future bookings
- "Past" tab shows completed bookings
- Each booking card shows:
  - Event name and location
  - Date and time
  - Number of seats
  - Purple info box explaining seat assignment requirement
  - **"Share Seats" button** (for event bookings only)

**New UI Elements**:
```
┌─────────────────────────────────────┐
│ 🏆 Summer Bass Tournament           │
│ 📍 Main Pond                         │
│ 📅 Oct 28, 2025 | ⏰ 10:00 AM       │
│                                      │
│ 💺 Seats: 1, 2, 3                   │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ 👥 Seat Assignment               │ │
│ │ You have 3 seats. Share them    │ │
│ │ with other users before check-in│ │
│ │ Each seat has unique QR code → │ │
│ └─────────────────────────────────┘ │
│                                      │
│ [Show QR]  [Share Seats]  [Delete] │
└─────────────────────────────────────┘
```

---

### Step 3: Share Seats (Assign to Users)
**Location**: Click "Share Seats" → `/bookings/[bookingId]/share`

**What You See**:
- Booking details (event name, date, pond, game)
- All seats in a grid layout
- Each seat card shows:
  - Seat number
  - Status badge (Available, Shared, Checked In)
  - QR code preview (small)
  - Assigned user info (if assigned)

**Actions Available**:
1. **Select a seat** to assign
2. **Enter user email** (must be registered in system)
3. **Click "Assign Seat"**

**What Happens When You Assign**:
- Seat status changes to "shared"
- `assignedUserId` is set to the target user's database ID
- `sharedAt` timestamp is recorded
- `sharedBy` is set to your user ID
- Target user receives a **notification**: "🎫 Seat Assigned to You!"
- Seat QR code remains the same (unchanged)

**Example UI**:
```
┌────────────────────────────────────────┐
│ Seat #1                         [QR]   │
│ ✅ Shared                              │
│                                        │
│ 👤 John Doe                            │
│    john@example.com                    │
│    Assigned Oct 25, 10:30 AM          │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Seat #2                         [QR]   │
│ ⏳ Available                           │
│                                        │
│ 👥 Not assigned yet                   │
│                                        │
│ [Selected - Enter Email Below]        │
└────────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 📧 Assign Seat #2                    │
│ ┌──────────────────────────────────┐ │
│ │ user@example.com                 │ │
│ └──────────────────────────────────┘ │
│ [Cancel]          [Assign Seat ✓]   │
└──────────────────────────────────────┘
```

**Important Notes**:
- You can assign seats to yourself too (using your own email)
- Users must have registered accounts in the system
- Once a seat is checked in, it **cannot be reassigned**
- Each seat can only be assigned to one user

---

### Step 4: Assigned User Views Their Seat
**Location**: Assigned user goes to `/bookings`

**What They See**:
- The booking appears in their "Upcoming" bookings
- Shows their specific seat number(s)
- Can click "Share Seats" to view seat details and QR code
- OR get their seat QR code from the notification

**Note**: The main `/bookings` page shows simplified booking info. To see individual seat QR codes, go to the seat sharing page.

---

### Step 5: Check-In at Event
**Location**: Self-service check-in kiosk (`/kiosk/checkin`)

**For Managers**:
1. Manager logs in and unlocks the kiosk
2. Kiosk shows "Ready to Scan" screen
3. Leave kiosk in scanning mode

**For Users**:
1. User arrives at event with their **seat QR code**
2. User scans seat QR code at kiosk (USB scanner)
3. System validates:
   - QR code exists
   - Booking date is within ±1 day window
   - Seat not already checked in
4. If valid:
   - Seat status → "checked-in"
   - `checkedInAt` timestamp recorded
   - **Rod label automatically prints** with new QR code
   - Success screen shows user name and seat number
5. User takes rod label and attaches to fishing rod

**Rod QR Code Format**: `ROD-{bookingId}-S{seatNum}-{random}`  
Example: `ROD-123-S1-abc123def456`

**Important**: 
- Each user checks in with their **seat QR code**
- After check-in, seat cannot be reassigned
- Rod QR code is different from seat QR code
- Rod QR is used later for weighing catches

---

### Step 6: Record Catches (Later During Event)
**Location**: Weighing station kiosk (`/kiosk/weighing`)

**Process**:
1. User catches a fish
2. Brings fish + tagged rod to weighing station
3. Manager/staff scans **rod QR code** (not seat QR)
4. System validates rod is active and legitimate
5. Enter catch weight (manual or auto from digital scale)
6. Optional: Enter length and species
7. System:
   - Creates WeighingRecord
   - Updates user stats
   - Calculates current ranking
   - Checks for achievement unlocks
   - Sends notification to user
8. Large display shows:
   - Weight in huge font
   - User nickname
   - Current ranking (e.g., "Rank 3 of 15")
   - Any achievements unlocked

---

## 🔑 Key QR Codes Explained

### 1. Seat QR Code
**Format**: `{bookingId}_SEAT_{seatNumber}_{timestamp}`  
**Example**: `BK-EVT-001_SEAT_1_1729876543210`

**Purpose**: Check-in at event  
**Generated**: When booking is created  
**Where to Find**: 
- Seat sharing page (`/bookings/[bookingId]/share`)
- Each seat card has a QR code preview
- Expandable to full size

**Usage**: 
- Scan at check-in kiosk
- One-time use (can't check in twice)
- Date-restricted (±1 day from event)

### 2. Rod QR Code
**Format**: `ROD-{bookingId}-S{seatNum}-{random}`  
**Example**: `ROD-123-S1-abc123def456`

**Purpose**: Weighing catches  
**Generated**: During check-in (auto-printed)  
**Where to Find**: 
- Physical label printed at check-in
- Attached to fishing rod

**Usage**:
- Scan at weighing station
- Multiple uses (can weigh multiple catches)
- Tracked with version numbers for replacements

---

## 🎨 UI Flow Summary

```
Booking Created
    ↓
/bookings (Shows "Share Seats" button)
    ↓
/bookings/[bookingId]/share (Assign seats to users)
    ↓
Assigned user receives notification
    ↓
User views their booking at /bookings
    ↓
User goes to event → /kiosk/checkin
    ↓
Scan seat QR → Check in → Rod label prints
    ↓
Catch fish → /kiosk/weighing
    ↓
Scan rod QR → Record weight → See ranking
```

---

## 📱 Mobile vs Kiosk

### Mobile UI (`/bookings` & `/bookings/[id]/share`)
- **Purpose**: Seat management before event
- **Who**: Booking leaders and assigned users
- **Actions**: 
  - View bookings
  - Share/assign seats
  - View seat QR codes
  - Download QR codes

### Kiosk UI (`/kiosk/checkin` & `/kiosk/weighing`)
- **Purpose**: Self-service at event venue
- **Who**: All event participants
- **Features**:
  - Manager lock/unlock
  - USB QR scanner support
  - Auto-focus input fields
  - Password-masked QR input
  - Large text displays
  - Auto-close screens (8 seconds)

---

## 🔒 Security & Validation

### Seat Assignment
- ✅ Only booking leader can assign seats
- ✅ Users must have registered accounts
- ✅ Email lookup to find users
- ✅ Cannot reassign after check-in

### Check-In
- ✅ Date validation (±1 day window)
- ✅ Duplicate check-in prevention
- ✅ QR code format validation
- ✅ Booking status verification

### Rod Tracking
- ✅ Unique rod QR per seat
- ✅ Version tracking for replacements
- ✅ Status validation (active/voided)
- ✅ Anti-fraud checks

### Weighing
- ✅ Rod must be active
- ✅ User must be checked in
- ✅ Legitimate rod validation
- ✅ Multiple catches allowed per rod

---

## 🐛 Troubleshooting

### "Share Seats" Button Not Showing
**Possible Causes**:
- Not an event booking (pond bookings don't need seat sharing)
- No seats in booking
- Seats array is empty

**Solution**: 
- Check `booking.type === 'event'`
- Check `booking.seats.length >= 1`

### "Invalid QR Code" at Check-In
**Possible Causes**:
- Using booking QR instead of seat QR
- Using rod QR at check-in kiosk
- Seat already checked in
- Event date is outside ±1 day window

**Solution**:
- Use the specific seat QR code from `/bookings/[id]/share`
- Verify event date is today or ±1 day
- Check seat status (must not be "checked-in" already)

### Seat Assignment Fails
**Possible Causes**:
- User email not found in database
- User not registered
- Network error

**Solution**:
- Verify user has created an account
- Check email spelling
- User must complete registration first

### Rod Label Not Printing
**Possible Causes**:
- Printer not connected
- Printer webhook not configured
- Printer offline

**Solution**:
- Check printer webhook at `/api/webhooks/devices`
- Verify printer status
- Manual fallback: Print replacement label later

---

## 📊 Database Structure

```sql
Booking
  ├── bookingId (string, e.g., "BK-EVT-001")
  ├── type ("EVENT" or "POND")
  ├── bookedByUserId (booking leader)
  └── BookingSeats[]
      ├── seatNumber (1, 2, 3...)
      ├── qrCode (unique seat QR)
      ├── status ("assigned", "shared", "checked-in")
      ├── assignedUserId (who owns this seat)
      ├── sharedAt (timestamp)
      ├── sharedBy (user ID of leader)
      ├── checkedInAt (timestamp)
      └── FishingRod
          ├── qrCode (unique rod QR)
          ├── version (for replacements)
          ├── status ("active", "voided")
          └── WeighingRecords[]
```

---

## 🎯 Best Practices

### For Booking Leaders
1. **Assign all seats before event day**
   - Don't wait until event starts
   - Give users time to prepare

2. **Verify user emails**
   - Double-check spelling
   - Confirm users have accounts

3. **Communicate with assigned users**
   - Let them know they're assigned
   - Remind them to check their notifications
   - Share event details

### For Assigned Users
1. **Save your seat QR code**
   - Screenshot from sharing page
   - Download QR code image
   - Keep notification accessible

2. **Arrive early**
   - Check-in window is ±1 day
   - But arrive 30 min early for event

3. **Bring your rod QR**
   - Don't lose the printed label
   - Attach securely to rod
   - Get replacement if damaged

### For Managers
1. **Unlock kiosks before event**
   - Check-in kiosk at entrance
   - Weighing station at designated area

2. **Keep USB scanners charged**
   - Test scanner before event
   - Have backup scanner ready

3. **Monitor printer status**
   - Check label printer has paper
   - Test print before event starts
   - Have manual backup labels

---

## 🚀 Quick Reference

### URLs
- **View Bookings**: `/bookings`
- **Share Seats**: `/bookings/[bookingId]/share`
- **Check-In Kiosk**: `/kiosk/checkin`
- **Weighing Station**: `/kiosk/weighing`
- **Manager Dashboard**: `/manager/dashboard`

### Key Fields
- `BookingSeat.qrCode`: For check-in
- `FishingRod.qrCode`: For weighing
- `BookingSeat.assignedUserId`: Who owns the seat
- `BookingSeat.status`: assigned → shared → checked-in
- `BookingSeat.checkedInAt`: Check-in timestamp

### Important Logic
- Only event bookings need seat sharing
- Seat QR ≠ Rod QR ≠ Booking QR
- Check-in date window: ±1 day from event
- One seat = One user = One rod QR
- Multiple catches per rod allowed

---

**Last Updated**: October 25, 2025  
**System Version**: 1.0
