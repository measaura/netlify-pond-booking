import { NextResponse } from 'next/server'
import { getPonds } from '@/lib/db-functions'

export async function GET() {
  try {
    const ponds = await getPonds()

    // Get today's date at midnight for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Normalize shape for client (compat with legacy fields) and calculate availability
    const normalized = ponds.map((p: any) => {
      const maxCapacity = p.maxCapacity ?? p.capacity ?? 0
      
      // Calculate total seats booked for today
      const todayBookings = p.bookings?.filter((b: any) => {
        const bookingDate = new Date(b.date)
        bookingDate.setHours(0, 0, 0, 0)
        return bookingDate.getTime() === today.getTime()
      }) || []
      
      const totalSeatsBooked = todayBookings.reduce((sum: number, booking: any) => {
        return sum + (booking.seatsBooked || 0)
      }, 0)
      
      const available = maxCapacity - totalSeatsBooked

      return {
        id: p.id,
        name: p.name,
        capacity: maxCapacity,
        maxCapacity: maxCapacity,
        available: Math.max(0, available), // Ensure non-negative
        price: p.price ?? 0,
        image: p.image ?? '🌊',
        bookingEnabled: p.bookingEnabled ?? true,
        shape: (p.shape || 'RECTANGLE').toLowerCase(),
        seatingArrangement: p.seatingArrangement ?? [5,5,5,5]
      }
    })

    return NextResponse.json({ ok: true, data: normalized })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch ponds' }, { status: 500 })
  }
}
