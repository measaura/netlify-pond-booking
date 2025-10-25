# 🎣 Rod QR Testing Guide

## Quick Start

**Best way to test rod QRs: Use the enhanced Test Generator page**

1. **Go to `/test-generator`** - Now includes comprehensive rod QR testing
2. **Generate seat QRs** - Use the existing seat QR generator (active event QRs work best)
3. **Generate rod QRs** - Use the new "Rod QR Testing System" section
4. **Download QR codes** - Get both seat and rod QRs for manual testing
5. **Test the flow** - Complete seat → rod → weighing workflow

## Enhanced Test Generator Features

The `/test-generator` page now includes:

### 🏭 Rod QR Generator
- Input field for seat QR data (copy from generated seat QRs)
- Station ID configuration (default: STATION-001)
- Replacement rod checkbox
- Quick test buttons for recently generated seat QRs
- Visual rod QR code generation

### 📊 Test Results Display
- Success/error feedback for rod generation
- Detailed rod information (rod ID, QR code, booking details)
- Visual QR codes ready for download
- Test status validation

### 🔍 Rod Status Testing
- Test button for each generated rod QR
- Validates rod exists in database
- Checks rod QR format and integrity
- Shows detailed rod status information

## Testing Workflow

### 1. Generate Test Data
```
1. Visit /test-generator
2. Generate active event QRs (green buttons - these work best)
3. Copy the QR data from a generated seat QR
4. Paste into rod QR generator
5. Configure station ID (optional)
6. Click "Generate Rod QR"
```

### 2. Download QR Codes
```
1. Download seat QR codes for check-in testing
2. Download rod QR codes for rod validation
3. Transfer to phone via AirDrop/email for scanning
4. Use "Download All" to get both seat and rod QRs at once
```

### 3. Test Complete Flow
```
1. Kiosk check-in with seat QR (/kiosk/checkin)
2. Generate rod QR from seat QR (via test generator)
3. Validate rod QR (via test status button)
4. Test weighing with rod QR (/scanner - weighing flow)
```

## Alternative: Manual API Testing

If you prefer to test the APIs directly:

### 1. Test Rod Printing API
```bash
curl -X POST http://localhost:3001/api/rod-printing/print \
  -H "Content-Type: application/json" \
  -d '{
    "seatQR": "{\"bookingId\":\"TEST-123\",\"pond\":\"Test Pond\",\"seats\":[\"1\"],\"date\":\"2024-01-15\",\"timeSlot\":\"14:00-16:00\"}",
    "stationId": "STATION-001",
    "isReplacement": false
  }'
```

### 2. Test Rod Status API
```bash
curl -X POST http://localhost:3001/api/rod-printing/status \
  -H "Content-Type: application/json" \
  -d '{
    "rodQR": "ROD-TEST-123-S1-A1B2"
  }'
```

## Advanced Testing Scenarios

### Happy Path Testing
1. **Valid active event** - Generate active event QR, convert to rod QR
2. **Valid time window** - Test during the booking time slot
3. **Replacement rods** - Test the replacement rod flag
4. **Multiple stations** - Test different station IDs

### Error Case Testing
1. **Invalid seat QR** - Test with malformed QR data
2. **Expired bookings** - Test with past event QRs
3. **Future bookings** - Test with future event QRs
4. **Duplicate rods** - Try to generate rod QR twice for same seat
5. **Invalid rod QR** - Test rod status with invalid QR codes

## Database Verification

### Check Rod Records
```bash
# Use the database query page at /admin/database
# Or query directly in browser console:
localStorage.getItem('fishingAppDB')
```

### Rod Data Structure
```json
{
  "rodId": "ROD-booking123-S1-A1B2",
  "bookingId": "TEST-123",
  "seatNumber": 1,
  "qrCode": "ROD-booking123-S1-A1B2",
  "stationId": "STATION-001",
  "isReplacement": false,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## Integration with Existing Workflows

### Kiosk Check-in Flow
1. Staff scans seat QR at `/kiosk/checkin`
2. Customer approaches rod printing station
3. Staff uses rod generator to create rod QR from seat QR
4. Customer receives physical rod (simulated by visual QR)

### Scanner/Weighing Flow
1. Customer brings fish + rod to weighing station
2. Staff scans rod QR at `/scanner`
3. System validates rod and booking
4. Staff records catch weight and species

### Manager Dashboard
1. View all rod printing sessions at `/manager`
2. Monitor rod distribution and usage
3. Track replacement rod statistics

## Troubleshooting

### Common Issues
- **"Invalid seat QR"** - Check QR format and ensure it contains booking data
- **"Booking not found"** - Ensure the booking exists in localStorage
- **"Invalid time slot"** - Check that current time is within booking window
- **"Rod already exists"** - Use replacement flag or test with different seat

### Debug Tips
- Check browser console for detailed error messages
- Verify booking data in localStorage (fishingAppDB)
- Test with active event QRs (generated recently)
- Ensure station ID format is correct (STATION-XXX)

### Test Data Reset
```javascript
// Clear all test data (run in browser console)
localStorage.removeItem('fishingAppDB')
```

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rod-printing/print` | POST | Generate rod QR from seat QR |
| `/api/rod-printing/status` | POST | Validate rod QR and get status |
| `/test-generator` | GET | Enhanced testing interface |
| `/kiosk/checkin` | GET | Seat QR check-in interface |
| `/scanner` | GET | Rod QR scanning interface |

---

**💡 Pro Tip**: The enhanced `/test-generator` page is now the most efficient way to test the complete rod QR workflow without any manual API calls or complex setup.
