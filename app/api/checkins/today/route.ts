import { NextResponse } from 'next/server'
import { getBookings, getBookingById } from '@/lib/db-functions'

export async function GET(request: Request) {
  try {
    const today = new Date()
    const bookings = await getBookings({ date: today })

    const checkIns: any[] = []
    for (const b of bookings) {
      // fetch full booking record so we have checkIns included
      const full = await getBookingById(b.id)
      if (!full) continue

      if (full.checkIns && full.checkIns.length > 0) {
        for (const c of full.checkIns) {
          checkIns.push({
            id: c.id,
            bookingId: full.id,
            bookingBookingId: full.bookingId,
            seatId: c.bookingSeatId,
            userId: c.userId,
            checkInAt: c.checkInAt,
            scannedBy: c.scannedBy,
            booking: {
              id: full.id,
              bookingId: full.bookingId,
              pond: full.pond || null,
              event: full.event || null,
            }
          })
        }
      }
    }

    return NextResponse.json({ ok: true, data: checkIns })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch today check-ins' }, { status: 500 })
  }
}
