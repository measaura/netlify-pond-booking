import { NextResponse } from 'next/server'
import { createBooking, generateUniqueBookingId, getBookingById, getBookings, cancelBooking } from '@/lib/db-functions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Expect bookingData shape matching createBooking
    const bookingId = await generateUniqueBookingId('POND')
    const seats = body.seats || []

    const bookingData = {
      bookingId,
      type: 'POND',
      bookedByUserId: body.bookedByUserId,
      pondId: body.pondId,
      date: new Date(body.date),
      timeSlotId: body.timeSlotId,
      seatsBooked: seats.length,
      totalPrice: body.totalPrice || 0,
      seatAssignments: seats.map((s: any) => ({ seatNumber: s.number, assignedUserId: s.assignedUserId, assignedName: s.assignedName, assignedEmail: s.assignedEmail }))
    }

    const result = await createBooking(bookingData as any)
    return NextResponse.json({ ok: true, data: result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to create booking' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const bookingId = url.searchParams.get('bookingId')
    const userId = url.searchParams.get('userId')
    const pondId = url.searchParams.get('pondId')
    const eventId = url.searchParams.get('eventId')

    if (bookingId) {
      const result = await getBookingById(parseInt(bookingId))
      return NextResponse.json({ ok: true, data: result })
    }

    if (userId) {
      const bookings = await getBookings({ userId: parseInt(userId) })
      return NextResponse.json({ ok: true, data: bookings })
    }

    if (pondId) {
      const bookings = await getBookings({ pondId: parseInt(pondId) })
      return NextResponse.json({ ok: true, data: bookings })
    }

    if (eventId) {
      const bookings = await getBookings({ eventId: parseInt(eventId) })
      return NextResponse.json({ ok: true, data: bookings })
    }

    return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch booking' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const bookingId = url.searchParams.get('bookingId')
    if (!bookingId) return NextResponse.json({ ok: false, error: 'missing bookingId' }, { status: 400 })

    const id = parseInt(bookingId)
    await cancelBooking(id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to delete booking' }, { status: 500 })
  }
}
