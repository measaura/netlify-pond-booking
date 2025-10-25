# Seat QR Code Visibility Enhancement

## Issue
**User Question**: "Seat assigned successfully. But now, where is the seat QR?"

**Problem**: After assigning a seat to a user, the QR code was hidden in a collapsed `<details>` section that required clicking "View QR Code" to expand.

## Solution Applied

### Enhanced Share Seats Page (`/bookings/[bookingId]/share`)

#### Before:
- QR codes hidden in collapsed section for ALL seats
- Required clicking "View QR Code: XXX..." to see it
- No easy way to download or share QR code
- Same treatment for assigned and unassigned seats

#### After:

**For Assigned Seats** (prominently displayed):
```
┌─────────────────────────────────────┐
│ Seat #1                      [QR]   │
│ ✅ Shared                           │
│                                     │
│ 👤+ John Doe                        │
│     john@example.com                │
│     Assigned Oct 25, 10:30 AM      │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Check-in QR Code                    │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │       [QR CODE IMAGE]           │ │
│ │                                 │ │
│ │  BK-EVT-001_SEAT_1_1234567890  │ │
│ │                                 │ │
│ │  [📥 Download QR Code]          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**For Unassigned Seats** (collapsed):
```
┌─────────────────────────────────────┐
│ Seat #2                      [QR]   │
│ ⏳ Available                        │
│                                     │
│ 👥 Not assigned yet                │
│                                     │
│ [Assign Seat]                      │
│                                     │
│ ▶ View QR Code: BK-EVT-001_SEAT... │ ← Click to expand
└─────────────────────────────────────┘
```

### Key Features Added

#### 1. **Prominent QR Display for Assigned Seats**
- QR code automatically visible (no clicking required)
- Displayed in white background with green border
- Larger size (160px max-width) for easy scanning
- Full QR code text shown below image

#### 2. **Download Button**
```typescript
<Button
  size="sm"
  variant="outline"
  onClick={() => {
    const link = document.createElement('a')
    link.href = qrDataUrls[seat.id]
    link.download = `seat-${seat.seatNumber}-qr.png`
    link.click()
  }}
>
  <QrCode className="mr-1 h-3 w-3" />
  Download QR Code
</Button>
```
- Downloads QR code as PNG file
- Filename: `seat-1-qr.png`, `seat-2-qr.png`, etc.
- Users can save and share easily

#### 3. **Visual Hierarchy**
- **Assigned seats**: QR code prominently displayed in green-bordered section
- **Unassigned seats**: QR code hidden in collapsible section
- Clear "Check-in QR Code" label
- Full QR string displayed for manual entry if needed

## User Flow for Assigned Users

### Method 1: Via Share Seats Page (Booking Leader)
1. Booking leader goes to `/bookings`
2. Clicks 👤+ icon next to event booking
3. Goes to Share Seats page
4. Sees all seats with assigned users
5. **QR codes automatically visible** for all assigned seats
6. Can download any QR code with one click
7. Can share QR code image with assigned users

### Method 2: Via Notifications (Assigned User)
1. User receives notification: "🎫 Seat Assigned to You!"
2. Clicks notification → Goes to `/bookings`
3. Finds the event booking in their list
4. Clicks "Show QR" button → Goes to ticket page
5. **Note**: Ticket page currently shows booking QR, not individual seat QR

### Method 3: Via Personal Bookings (Assigned User)
1. Assigned user logs in
2. Goes to `/bookings` page
3. Sees event booking with their assigned seat(s)
4. Clicks 👤+ icon to view Share Seats page
5. Sees their seat with QR code prominently displayed
6. Downloads QR code for check-in

## QR Code Types Explained

### 1. **Seat QR Code** (for check-in)
- Format: `{bookingId}_SEAT_{seatNumber}_{timestamp}`
- Example: `BK-EVT-001_SEAT_1_1729876543210`
- **Purpose**: Check-in at event entrance
- **Where**: Share Seats page, prominently displayed for assigned seats
- **Usage**: Scan at `/kiosk/checkin`

### 2. **Booking QR Code** (for reference)
- Format: JSON blob with booking info
- **Purpose**: General booking reference
- **Where**: Ticket page (`/ticket?bookingId=XXX`)
- **Usage**: Not for check-in, just information display

### 3. **Rod QR Code** (for weighing)
- Format: `ROD-{bookingId}-S{seatNum}-{random}`
- Example: `ROD-123-S1-abc123`
- **Purpose**: Record fish catches at weighing station
- **Where**: Printed label after check-in
- **Usage**: Scan at `/kiosk/weighing`

## File Modified

### `/app/bookings/[bookingId]/share/page.tsx`

**Changes**:
1. Added conditional rendering for assigned vs unassigned seats
2. Created prominent QR section inside green "Assigned" box:
   - Border top divider
   - "Check-in QR Code" label
   - White background with green border
   - QR code image (160px)
   - Full QR string below
   - Download button
3. Moved unassigned seat QR codes to collapsed `<details>` section
4. Added QR icon to collapsed section header
5. Added full QR string display for manual entry

**Code Structure**:
```typescript
{seat.assignedTo ? (
  <div className="bg-green-50">
    {/* User info */}
    
    {/* NEW: Prominent QR Code Section */}
    {qrDataUrls[seat.id] && (
      <div className="mt-3 pt-3 border-t border-green-200">
        <p className="text-xs font-semibold">Check-in QR Code</p>
        <div className="bg-white p-3 rounded border">
          <img src={qrDataUrls[seat.id]} />
          <p className="font-mono">{seat.qrCode}</p>
          <Button onClick={downloadQR}>Download QR Code</Button>
        </div>
      </div>
    )}
  </div>
) : (
  /* Unassigned: QR in collapsed details */
  <details>...</details>
)}
```

## Benefits

### For Booking Leaders:
✅ See all seat QR codes at a glance  
✅ Download QR codes to share with assigned users  
✅ Verify seat assignments visually  
✅ Easy access to QR codes for troubleshooting  

### For Assigned Users:
✅ Find their seat QR code easily on Share Seats page  
✅ Download QR code to phone/computer  
✅ Have QR code ready for event check-in  
✅ Can share seat with others if needed  

### For Event Staff:
✅ Can help users find their QR codes  
✅ Visual confirmation of seat assignments  
✅ QR codes always accessible and scannable  

## Next Steps (Optional Enhancements)

### 1. **Show QR in User's Bookings Page**
When a user has an assigned seat, show their specific seat QR on the main `/bookings` page without requiring navigation to Share Seats page.

### 2. **Email QR Code on Assignment**
Send email with attached QR code image when seat is assigned to user.

### 3. **QR Code in Notification**
Include clickable link to download QR code directly from notification.

### 4. **Mobile-Optimized QR View**
Create a full-screen QR code view for easy scanning at check-in.

### 5. **Multi-Seat User View**
If user has multiple seats, show all their QR codes in a carousel or grid.

---

**Status**: ✅ Enhanced and ready to use  
**Date**: October 25, 2025  
**Impact**: High - Critical for user experience at check-in
