# Booking Sharing, Check-ins, and Catch Weight Recording System

## Overview
Complete QR-based system for managing event bookings with seat sharing, self-service check-ins, rod tracking, and catch weight recording with automatic ranking and achievements.

## Architecture

### Core Flow
```
1. Leader books multiple seats → Each seat gets unique QR code
2. Leader shares seats to other users → Notifications sent
3. Users check in via QR scan → Rod labels auto-printed
4. Users bring catch + rod to weighing station → Weight recorded
5. System updates rankings → Achievements checked → Leaderboard updated
```

### Key Components

#### 1. Database Schema (Prisma)
- **BookingSeat**: Seat assignments with QR codes
  - `sharedAt`, `sharedBy`: Tracking who shared when
  - Status: `assigned`, `shared`, `checked-in`, `completed`
  - Relations: User, Booking, CheckInRecord, FishingRod

- **FishingRod**: Physical rod tracking with QR labels
  - Version tracking for replacements
  - Status: `assigned`, `active`, `voided`, `lost`, `returned`
  - Unique QR: `ROD-{bookingId}-S{seatNum}-{random}`

- **CheckInRecord**: Check-in timestamps and validation
- **WeighingRecord**: Catch weights with ranking snapshots
- **RodPrintSession**: Audit trail for label printing

#### 2. API Endpoints

##### Seat Sharing
- **POST** `/api/bookings/[bookingId]/seats/share`
  - Share seat to user by email
  - Creates notification for assigned user
  - Validates leader ownership

- **GET** `/api/bookings/[bookingId]/seats/share`
  - Get all seats for booking with status

##### Check-In System
- **POST** `/api/checkins/scan`
  - Check-in user with seat QR code
  - Date validation (±1 day window)
  - Returns `needsRodPrint` flag for automatic printing

- **GET** `/api/checkins/scan?qrCode={qrCode}`
  - Get check-in status by QR code

##### Rod Printing
- **POST** `/api/rod-printing/print`
  - Generate and print rod QR label
  - Supports replacement labels (voids old rod)
  - Tracks version numbers

- **GET** `/api/rod-printing/print?rodQrCode={qrCode}`
  - Get rod status by QR code

##### Weighing Station
- **POST** `/api/weighing/record`
  ```json
  {
    "rodQrCode": "ROD-123-S1-abc123",
    "weight": 2.5,
    "length": 45.5,
    "species": "Bass",
    "scaleId": "SCALE-01",
    "weighedBy": "manager@example.com"
  }
  ```
  - Records catch weight
  - Validates rod is active and legitimate
  - Updates user stats and checks achievements
  - Calculates real-time ranking
  - Creates notifications

- **GET** `/api/weighing/record?eventId={id}` or `?userId={id}` or `?rodQrCode={qrCode}`
  - Get weighing records with filters

##### External Device Integration
- **POST** `/api/webhooks/devices` (Scale)
  ```json
  {
    "deviceId": "SCALE-01",
    "type": "scale",
    "weight": 2500,
    "unit": "g"
  }
  ```

- **PUT** `/api/webhooks/devices` (Printer)
  ```json
  {
    "deviceId": "PRINTER-01",
    "status": "ready"
  }
  ```

#### 3. User Interfaces

##### Self-Service Check-In Kiosk (`/app/kiosk/checkin/page.tsx`)
- **Manager Lock/Unlock System**
  - Role-based access (manager/admin only)
  - Kiosk locked by default

- **USB QR Scanner Integration**
  - Auto-focus input field
  - Enter key detection (scanner sends Enter after scan)
  - Keyboard input simulation support

- **Auto-Flow**
  1. Manager unlocks kiosk
  2. User scans seat QR code
  3. System validates and checks in
  4. Rod label automatically printed
  5. Success screen shows (8 seconds)
  6. Reset to scanning

- **State Machine**
  - `locked` → `unlocked` → `scanning` → `processing` → `success/error` → `unlocked`

##### Weighing Station Kiosk (`/app/kiosk/weighing/page.tsx`)
- **Similar Manager Lock/Unlock**
- **Rod QR Scanning**
- **Weight Input**
  - Manual entry or auto-filled from scale webhook
  - Supports 3 decimal places (kg)
  - Optional: length (cm) and species

- **Result Display**
  - Large weight display (8xl font)
  - Current ranking and position
  - Achievement unlocks
  - User nickname prominently shown
  - Auto-close after 8 seconds

- **Scale Connection Status**
  - Real-time connection indicator
  - Simulated 90% uptime

##### Seat Sharing UI (`/app/bookings/[bookingId]/share/page.tsx`)
- **Booking Leader View**
  - See all seats with status
  - Assign seats to users by email
  - Visual QR codes for each seat
  - Assignment history

- **Seat Status Display**
  - Color-coded badges (assigned, shared, checked-in, completed)
  - User info for assigned seats
  - Prevent reassignment after check-in

- **Bulk Sharing**
  - Select seat → Enter email → Assign
  - Confirmation before assignment
  - Notifications sent automatically

- **Statistics**
  - Assigned count
  - Checked-in count
  - Available seats count

## Usage Workflows

### 1. Leader Books and Shares Seats
```
1. Leader books event with 5 seats
2. Goes to /bookings → Click "Share Seats" button
3. Selects Seat #2, enters friend@example.com
4. Friend receives notification with seat QR code
5. Repeat for other seats
```

### 2. Self-Service Check-In
```
1. Manager arrives at event, logs in
2. Goes to /manager/dashboard → "Check-In Kiosk"
3. Unlocks kiosk (requires manager role)
4. User arrives, scans seat QR code with USB scanner
5. System validates:
   - Date within ±1 day window
   - Seat not already checked in
   - QR code is valid
6. Auto-prints rod label with QR: ROD-123-S1-abc123
7. User receives label, attaches to rod
8. Success screen shows for 8 seconds
9. Kiosk resets to scanning mode
```

### 3. Catch Weight Recording
```
1. Manager sets up weighing station kiosk
2. User brings catch and tagged rod
3. Manager/user scans rod QR code
4. Places fish on scale:
   - Auto-fills weight if scale connected via webhook
   - OR manually enters weight
5. Optional: Enter length (cm) and species
6. System:
   - Validates rod is active
   - Creates WeighingRecord + CatchRecord
   - Updates user stats (totalCatches, heaviestCatch, etc.)
   - Checks achievements (First Catch, Trophy Hunter, etc.)
   - Calculates current ranking in event
7. Success screen shows:
   - Large weight display (e.g., "2.500 kg")
   - Current rank (e.g., "Rank 3 of 15 participants")
   - Achievement unlocks (if any)
   - User nickname
8. User receives notification of catch and ranking
```

### 4. Rod Label Replacement
```
If rod label is torn/damaged:
1. User returns to check-in kiosk
2. Scans old rod QR (still valid)
3. System voids old rod, prints new label
4. New rod has incremented version number
5. Catch recording works with new rod QR
```

## External Device Integration

### USB QR Scanner
- **Setup**: Configure as keyboard wedge mode
- **Behavior**: Scanner inputs text + Enter key
- **UI Integration**: Auto-focused input field + Enter key listener

### Label Printer
- **Trigger**: Automatic after check-in
- **Data Format**: 
  ```json
  {
    "qrCode": "ROD-123-S1-abc123",
    "seatNumber": 1,
    "userName": "John Doe",
    "eventName": "Summer Bass Tournament",
    "date": "2024-06-15",
    "version": 1
  }
  ```
- **Status Updates**: POST to `/api/webhooks/devices`

### Digital Scale
- **Connection**: Webhook to `/api/webhooks/devices`
- **Data Format**:
  ```json
  {
    "deviceId": "SCALE-01",
    "type": "scale",
    "weight": 2500,
    "unit": "g"
  }
  ```
- **Auto-Conversion**: System converts g → kg automatically

## Security & Validation

### Date Window Validation
- Check-in allowed ±1 day from event date
- Prevents early/late check-ins
- Configurable in `/api/checkins/scan`

### Rod Validation
- Only active rods can record catches
- Voided rods rejected
- Version tracking prevents duplicate use

### Duplicate Prevention
- Seat can only be checked in once
- Rod QR is unique per seat
- Replacement rods void previous version

### Role-Based Access
- Kiosks require manager/admin authentication
- Regular users can only share their own seats
- Managers see all bookings

## Notifications

### Auto-Generated Notifications
1. **Seat Assignment**: When leader shares seat
   - Title: "🎫 Seat Assigned to You!"
   - Action: View bookings
   - Priority: High

2. **Catch Recorded**: After weight recording
   - Title: "🎣 Catch Recorded!"
   - Message: Weight and current rank
   - Action: View leaderboard
   - Priority: Normal

3. **Achievement Unlocked**: When criteria met
   - Title: "🏆 Achievement Unlocked: {name}"
   - Message: Achievement description
   - Action: View profile
   - Priority: High

## Performance Considerations

### Real-Time Ranking Calculation
- Queries all catches for event/game
- Orders by weight DESC
- Caches in WeighingRecord for historical data
- Uses Prisma's `orderBy` and indexing

### QR Code Generation
- Uses `crypto.randomBytes()` for uniqueness
- Format: `ROD-{bookingId}-S{seatNum}-{hex}`
- Indexed in database for fast lookups

### Auto-Close Timers
- Success screens: 8 seconds
- Error screens: 8 seconds
- Prevents screen blocking

## Testing Checklist

- [ ] Leader can book multiple seats
- [ ] Seat sharing creates notifications
- [ ] Check-in validates date window
- [ ] Rod labels print automatically
- [ ] USB scanner inputs work correctly
- [ ] Weight recording updates stats
- [ ] Ranking calculation is accurate
- [ ] Achievements unlock correctly
- [ ] Duplicate check-ins are prevented
- [ ] Rod replacement voids old rod
- [ ] Manager lock/unlock works
- [ ] Auto-close timers work
- [ ] Scale webhook integration works
- [ ] Printer webhook integration works
- [ ] Kiosk navigation is intuitive

## Future Enhancements

1. **Photo Capture**: Add camera support for catch photos
2. **Auto-Scale Integration**: Direct RS232/USB scale reading
3. **Printer Queue**: Handle multiple print jobs
4. **Offline Mode**: Queue actions when network down
5. **Multi-Language**: Support multiple languages
6. **Mobile Check-In**: User self-check-in on mobile
7. **Live Leaderboard Display**: Public leaderboard screen
8. **Email Seat QR**: Auto-send QR code via email
9. **SMS Notifications**: Text message alerts
10. **Analytics Dashboard**: Manager insights and reports

## File Structure

```
app/
├── api/
│   ├── bookings/
│   │   └── [bookingId]/
│   │       └── seats/
│   │           └── share/
│   │               └── route.ts (POST/GET seat sharing)
│   ├── checkins/
│   │   └── scan/
│   │       └── route.ts (POST/GET check-in)
│   ├── rod-printing/
│   │   └── print/
│   │       └── route.ts (POST/GET rod printing)
│   ├── weighing/
│   │   └── record/
│   │       └── route.ts (POST/GET weighing)
│   └── webhooks/
│       └── devices/
│           └── route.ts (POST scale, PUT printer)
├── bookings/
│   ├── page.tsx (bookings list with "Share Seats" button)
│   └── [bookingId]/
│       └── share/
│           └── page.tsx (seat sharing UI)
└── kiosk/
    ├── checkin/
    │   └── page.tsx (self-service check-in kiosk)
    └── weighing/
        └── page.tsx (weighing station kiosk)

prisma/
└── schema.prisma (BookingSeat, FishingRod, CheckInRecord, WeighingRecord, etc.)
```

## API Response Examples

### Successful Check-In
```json
{
  "ok": true,
  "data": {
    "checkInRecord": {
      "id": 123,
      "seatId": 456,
      "checkInTime": "2024-06-15T10:30:00Z"
    },
    "needsRodPrint": true,
    "rodPrintData": {
      "qrCode": "ROD-789-S1-abc123",
      "seatNumber": 1,
      "userName": "John Doe"
    }
  }
}
```

### Successful Weight Recording
```json
{
  "ok": true,
  "data": {
    "displayInfo": {
      "userName": "John Doe",
      "nickname": "BigBass",
      "weight": "2.500",
      "length": "45.5",
      "species": "Bass",
      "seatNumber": 1,
      "bookingId": "BK-789",
      "eventName": "Summer Bass Tournament",
      "gameName": "Heaviest Fish"
    },
    "ranking": {
      "currentRank": 3,
      "totalParticipants": 15,
      "message": "You're in 3rd place!"
    },
    "achievements": [
      {
        "name": "First Catch",
        "description": "Record your first catch",
        "icon": "🎣"
      }
    ]
  }
}
```

## Troubleshooting

### USB Scanner Not Working
- Check keyboard wedge mode enabled
- Verify auto-focus on input field
- Test with manual input + Enter key

### Rod Label Not Printing
- Check printer webhook status
- Verify printer is online
- Check `/api/rod-printing/print` response

### Weight Not Auto-Filling
- Check scale webhook connection
- Verify scale device ID matches
- Test manual webhook POST

### Check-In Validation Fails
- Verify event date is ±1 day from today
- Check seat QR code format
- Ensure seat not already checked in

### Kiosk Won't Unlock
- Verify user has manager or admin role
- Check AuthGuard on kiosk pages
- Clear browser cache and retry

## Deployment Notes

### Environment Variables
```env
DATABASE_URL="postgresql://..."
```

### Database Migration
```bash
npx prisma db push
npx prisma generate
```

### Production Considerations
1. Set up dedicated kiosk devices
2. Configure USB scanner hardware
3. Connect label printer via webhook
4. Connect digital scale via webhook
5. Test auto-close timers in production
6. Monitor notification delivery
7. Set up achievement criteria

---

**System Version**: 1.0  
**Last Updated**: 2024  
**Dependencies**: Next.js 15.5.4, Prisma 6.17.1, qrcode 1.5.4
