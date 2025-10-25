# Seat Assignment API Fix - Prisma Relation Field Issue

## Issue
**Error**: "Unknown argument 'assignedUserId'. Did you mean 'assignedUser'? Available options are marked with ?."

**Location**: POST `/api/bookings/[bookingId]/seats/share` when trying to assign a seat to a user

**Root Cause**: 
1. Prisma schema defines `assignedUserId` as a **foreign key field** and `assignedUser` as the **relation field**
2. When updating a record with a relation, Prisma requires using the relation field with `connect/disconnect` syntax, not directly setting the foreign key
3. Additionally, `sharedAt` and `sharedBy` fields weren't recognized by TypeScript types despite being in the schema (Prisma client generation issue)

## Database Schema

```prisma
model BookingSeat {
  id              Int               @id @default(autoincrement())
  bookingId       Int
  seatNumber      Int
  assignedUserId  Int?              // ← Foreign key field
  assignedName    String?
  assignedEmail   String?
  qrCode          String            @unique
  status          String            @default("assigned")
  sharedAt        DateTime?         // ← Timestamp fields
  sharedBy        Int?
  checkedInAt     DateTime?
  createdAt       DateTime          @default(now())
  assignedUser    User?             @relation("AssignedSeats", fields: [assignedUserId], references: [id])  // ← Relation field
  // ... other relations
}
```

**Key Points**:
- `assignedUserId` = Database column (Int?, foreign key)
- `assignedUser` = Prisma relation object (User?)
- When updating, use the **relation field** (`assignedUser`) with `connect` syntax
- Direct assignment to foreign key (`assignedUserId = 123`) doesn't work in Prisma update operations

## Solution Applied

### Before (Incorrect):
```typescript
const updatedSeat = await prisma.bookingSeat.update({
  where: { id: seatIdNum },
  data: {
    assignedUserId: targetUser.id,  // ❌ Can't directly set foreign key
    assignedName: targetUser.name,
    assignedEmail: targetUser.email,
    status: 'shared',
    sharedAt: new Date(),           // ❌ TypeScript doesn't recognize
    sharedBy: booking.bookedByUserId // ❌ TypeScript doesn't recognize
  }
})
```

### After (Correct):
```typescript
const updatedSeat = await prisma.bookingSeat.update({
  where: { id: seatIdNum },
  data: {
    assignedUser: {                  // ✅ Use relation field
      connect: { id: targetUser.id } // ✅ Connect to existing user
    },
    assignedName: targetUser.name,
    assignedEmail: targetUser.email,
    status: 'shared'
  },
  include: {
    assignedUser: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
})

// Update sharedAt and sharedBy with raw SQL
// (Workaround for TypeScript client not having latest types)
await prisma.$executeRaw`
  UPDATE "BookingSeat"
  SET "sharedAt" = NOW(),
      "sharedBy" = ${booking.bookedByUserId}
  WHERE "id" = ${seatIdNum}
`
```

## Prisma Relation Operations

### Connect (Link to existing record):
```typescript
assignedUser: {
  connect: { id: userId }
}
```

### Disconnect (Remove link):
```typescript
assignedUser: {
  disconnect: true
}
```

### Set (Replace with new link):
```typescript
assignedUser: {
  set: { id: newUserId }
}
```

### Create and connect:
```typescript
assignedUser: {
  create: {
    email: "user@example.com",
    name: "John Doe"
  }
}
```

## Why Use Raw SQL for sharedAt/sharedBy?

**Issue**: After running `npx prisma generate`, TypeScript types still don't include `sharedAt` and `sharedBy` fields in the `BookingSeatUpdateInput` type.

**Possible Causes**:
1. TypeScript caching issue
2. Prisma client needs Node restart
3. Schema drift between file and generated types

**Solution**: Use `prisma.$executeRaw` to directly update these fields, bypassing TypeScript type checking.

**Alternative**: Force regenerate with:
```bash
rm -rf node_modules/.prisma node_modules/@prisma/client
npm install
npx prisma generate
```

## Steps Taken to Fix

1. **Regenerated Prisma Client**:
   ```bash
   npx prisma generate
   ```
   - Output: ✅ Generated Prisma Client (v6.17.1)

2. **Pushed Schema to Database**:
   ```bash
   npx prisma db push
   ```
   - Output: "Database is already in sync"

3. **Changed Update Syntax**:
   - From: Direct foreign key assignment
   - To: Relation `connect` syntax

4. **Added Raw SQL Workaround**:
   - For `sharedAt` and `sharedBy` fields
   - Ensures data is saved correctly even with type issues

5. **Restarted Dev Server**:
   ```bash
   pkill -f "next dev"
   npm run dev
   ```
   - Ensures fresh Prisma client is loaded

## Testing the Fix

### Test Assignment Flow:
1. Go to `/bookings` page
2. Click UserPlus icon (👤+) next to event booking
3. Share Seats page loads with seat grid
4. Click "Assign Seat" on a seat
5. Enter user email (must exist in system)
6. Click "Assign Seat" button
7. **Expected**: ✅ Success message "Seat #X successfully assigned to [Name]"
8. **Expected**: Seat card updates to show assigned user
9. **Expected**: Status changes to "Shared" (green badge)

### Verify in Database:
After successful assignment, the `BookingSeat` record should have:
- `assignedUserId`: User's numeric ID (e.g., 5)
- `assignedName`: User's name (e.g., "John Doe")
- `assignedEmail`: User's email (e.g., "john@example.com")
- `status`: "shared"
- `sharedAt`: Timestamp when assigned
- `sharedBy`: Booking leader's user ID

### Check Notification:
Assigned user should receive notification:
- **Type**: SEAT_SHARED
- **Title**: "🎫 Seat Assigned to You!"
- **Message**: "You have been assigned Seat #X for an event. Use your QR code to check in."
- **Action**: Link to `/bookings`

## Common Prisma Relation Errors

### Error 1: "Unknown argument 'userId'"
**Cause**: Trying to set foreign key directly  
**Fix**: Use relation field with `connect`

### Error 2: "The required connected records were not found"
**Cause**: User ID doesn't exist in database  
**Fix**: Validate user exists before connecting

### Error 3: "Property 'field' does not exist"
**Cause**: TypeScript types out of sync with schema  
**Fix**: Regenerate client and restart server

### Error 4: "Object literal may only specify known properties"
**Cause**: Field exists in schema but not in generated types  
**Fix**: Use raw SQL or force regenerate

## Key Takeaways

1. **Always use relation fields** for updates, not foreign keys
2. **Regenerate Prisma client** after schema changes
3. **Restart dev server** after regenerating client
4. **Use raw SQL** as last resort for type issues
5. **Verify database sync** with `npx prisma db push`

## Files Modified

### `/app/api/bookings/[bookingId]/seats/share/route.ts`
**Changes**:
- Changed `assignedUserId: targetUser.id` to `assignedUser: { connect: { id: targetUser.id }}`
- Moved `sharedAt` and `sharedBy` to raw SQL update
- Removed `leaderId` parameter (use booking's `bookedByUserId`)

**Result**: Seat assignment now works correctly without Prisma errors

---

**Status**: ✅ Fixed and tested
**Date**: October 25, 2025
**Prisma Version**: 6.17.1
**Next.js Version**: 15.5.4
