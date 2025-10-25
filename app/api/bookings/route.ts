import { NextResponse } from 'next/server'
import { createBooking, generateUniqueBookingId, getBookingById, getBookingByBookingId, getBookings, cancelBooking, updateStatsAfterBooking } from '@/lib/db-functions'
import prisma from '@/lib/db-functions'

// Transform database booking to match client BookingData interface
function transformBooking(booking: any) {
  if (!booking) return null
  
  return {
    ...booking,
    // Normalize type to lowercase for client
    type: booking.type === 'EVENT' ? 'event' : 'pond',
    // Map seatAssignments to seats for backward compatibility
    seats: booking.seatAssignments?.map((sa: any) => ({
      id: sa.id,
      number: sa.seatNumber,
      row: '', // Not used in current schema
    })) || [],
    // Keep original seatAssignments for detailed info if needed
    seatAssignments: booking.seatAssignments,
    // Map bookedBy to userId fields
    userId: booking.bookedBy?.id || booking.bookedByUserId,
    userName: booking.bookedBy?.name || '',
    userEmail: booking.bookedBy?.email || '',
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Expect bookingData shape matching createBooking
    const type = body.type === 'event' ? 'EVENT' : 'POND'
    const bookingId = await generateUniqueBookingId(type)
    const seats = body.seats || []

    const bookingData: any = {
      bookingId,
      type,
      bookedByUserId: body.bookedByUserId,
      date: new Date(body.date),
      seatsBooked: seats.length,
      totalPrice: body.totalPrice || 0,
      seatAssignments: seats.map((s: any) => ({ 
        seatNumber: s.number, 
        assignedUserId: s.assignedUserId, 
        assignedName: s.assignedName, 
        assignedEmail: s.assignedEmail 
      }))
    }

    // Add event-specific or pond-specific fields
    if (type === 'EVENT') {
      bookingData.eventId = body.eventId
      bookingData.pondId = body.pondId // Optional for events
    } else {
      bookingData.pondId = body.pondId
      bookingData.timeSlotId = body.timeSlotId
    }

    const result = await createBooking(bookingData)

    // Update stats and check for achievements
    const achievementResult = await updateStatsAfterBooking(body.bookedByUserId, result)
    const unlockedAchievements = achievementResult?.newAchievements || []

    // Create notifications for newly unlocked achievements
    if (unlockedAchievements.length > 0) {
      await Promise.all(
        unlockedAchievements.map((achievement: any) =>
          prisma.notification.create({
            data: {
              userId: body.bookedByUserId,
              type: 'ACHIEVEMENT',
              title: '🎉 Achievement Unlocked!',
              message: `${achievement.name}: ${achievement.description}`,
              actionUrl: '/journey',
              priority: 'high',
            },
          })
        )
      )
    }

    return NextResponse.json({ 
      ok: true, 
      data: result,
      achievements: unlockedAchievements 
    })
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
      // Check if bookingId is a number (database ID) or string (bookingId like "BK-EVT-001")
      const numericId = parseInt(bookingId)
      const result = isNaN(numericId) 
        ? await getBookingByBookingId(bookingId) // String bookingId
        : await getBookingById(numericId) // Numeric database ID
      return NextResponse.json({ ok: true, data: transformBooking(result) })
    }

    if (userId) {
      const userIdNum = parseInt(userId)
      
      // Get bookings where user is the leader OR has an assigned seat
      const bookings = await prisma.booking.findMany({
        where: {
          OR: [
            { bookedByUserId: userIdNum }, // Bookings created by user
            { seatAssignments: { some: { assignedUserId: userIdNum } } } // Bookings with seats assigned to user
          ]
        },
        include: {
          bookedBy: true,
          pond: true,
          event: {
            include: {
              eventGames: {
                include: {
                  game: true,
                  prizeSet: {
                    include: {
                      prizes: true,
                    }
                  }
                }
              }
            }
          },
          timeSlot: true,
          seatAssignments: {
            include: {
              assignedUser: true,
              fishingRod: true,
            }
          },
        },
        orderBy: { date: 'asc' }
      })
      
      const transformed = bookings.map(transformBooking)
      return NextResponse.json({ ok: true, data: transformed })
    }

    if (pondId) {
      const bookings = await getBookings({ pondId: parseInt(pondId) })
      const transformed = bookings.map(transformBooking)
      return NextResponse.json({ ok: true, data: transformed })
    }

    if (eventId) {
      const bookings = await getBookings({ eventId: parseInt(eventId) })
      const transformed = bookings.map(transformBooking)
      return NextResponse.json({ ok: true, data: transformed })
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
