import { NextResponse } from 'next/server'
import { getBookingByBookingId, getUserById } from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 401 }
      )
    }

    const { bookingId } = await params

    // Fetch booking with all related data
    const dbBooking = await getBookingByBookingId(bookingId)

    if (!dbBooking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this booking (either booked by them or assigned a seat)
    const hasAccess = 
      dbBooking.bookedByUserId === user.id ||
      dbBooking.seatAssignments?.some((seat: any) => seat.assignedUserId === user.id)

    if (!hasAccess && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { ok: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get event start/end time from timeSlot if available
    const startTime = '00:00' // Default fallback
    const endTime = '23:59' // Default fallback

    // Format booking data for the Share Seats page
    const booking = {
      id: dbBooking.id,
      bookingId: dbBooking.bookingId,
      bookingDate: dbBooking.date.toISOString(),
      startTime,
      endTime,
      status: dbBooking.status,
      totalSeats: dbBooking.seatAssignments?.length || 0,
      event: dbBooking.event ? {
        id: dbBooking.event.id,
        name: dbBooking.event.name,
        description: dbBooking.event.description
      } : null,
      game: dbBooking.event?.eventGames?.[0]?.game ? {
        id: dbBooking.event.eventGames[0].game.id,
        name: dbBooking.event.eventGames[0].game.name
      } : null,
      pond: dbBooking.pond ? {
        id: dbBooking.pond.id,
        name: dbBooking.pond.name
      } : null
    }

    return NextResponse.json({
      ok: true,
      booking
    })

  } catch (error: any) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}
