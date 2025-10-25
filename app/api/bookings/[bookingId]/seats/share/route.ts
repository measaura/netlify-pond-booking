import { NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'

/**
 * Share/Assign a seat to another user
 * POST /api/bookings/[bookingId]/seats/share
 * 
 * Body: {
 *   seatId: string,      // BookingSeat id
 *   userEmail: string,   // Email of user to assign seat to
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const body = await request.json()
    const { seatId, userEmail } = body
    // bookingId is the string ID like "BK-EVT-001"
    const { bookingId: bookingIdString } = await params

    if (!seatId || !userEmail) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: seatId, userEmail' },
        { status: 400 }
      )
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { bookingId: bookingIdString },
      include: { seatAssignments: true }
    })

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Find the seat - seatId could be string or number
    const seatIdNum = typeof seatId === 'string' ? parseInt(seatId) : seatId
    const seat = await prisma.bookingSeat.findUnique({
      where: { id: seatIdNum }
    })

    if (!seat || seat.bookingId !== booking.id) {
      return NextResponse.json(
        { ok: false, error: 'Seat not found or does not belong to this booking' },
        { status: 404 }
      )
    }

    // Check if seat is already checked in
    if (seat.checkedInAt) {
      return NextResponse.json(
        { ok: false, error: 'Cannot reassign a seat that has been checked in' },
        { status: 400 }
      )
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!targetUser) {
      return NextResponse.json(
        { ok: false, error: 'User with this email not found. They must have an account.' },
        { status: 404 }
      )
    }

    // Update seat assignment
    const updatedSeat = await prisma.bookingSeat.update({
      where: { id: seatIdNum },
      data: {
        assignedUser: {
          connect: { id: targetUser.id }
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
    
    // Update sharedAt and sharedBy separately if they exist in schema
    // (TypeScript client might not have latest schema)
    await prisma.$executeRaw`
      UPDATE "BookingSeat"
      SET "sharedAt" = NOW(),
          "sharedBy" = ${booking.bookedByUserId}
      WHERE "id" = ${seatIdNum}
    `

    // Create notification for the assigned user
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: 'SEAT_SHARED',
        title: '🎫 Seat Assigned to You!',
        message: `You have been assigned Seat #${seat.seatNumber} for ${booking.type === 'EVENT' ? 'an event' : 'a pond session'}. Use your QR code to check in.`,
        actionUrl: `/bookings`,
        priority: 'high'
      }
    })

    return NextResponse.json({
      ok: true,
      data: updatedSeat,
      message: `Seat #${seat.seatNumber} successfully assigned to ${targetUser.name}`
    })

  } catch (error: any) {
    console.error('Seat sharing error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to share seat' },
      { status: 500 }
    )
  }
}

/**
 * Get all seats for a booking with their assignment status
 * GET /api/bookings/[bookingId]/seats/share
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    // bookingId is the string ID like "BK-EVT-001", not the numeric id
    const { bookingId: bookingIdString } = await params

    const booking = await prisma.booking.findUnique({
      where: { bookingId: bookingIdString },
      include: {
        seatAssignments: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            fishingRod: {
              select: {
                qrCode: true,
                status: true
              }
            }
          },
          orderBy: { seatNumber: 'asc' }
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        event: {
          select: {
            id: true,
            name: true,
            date: true
          }
        },
        pond: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Map seatAssignments to match the expected interface
    const seats = (booking as any).seatAssignments.map((seat: any) => ({
      id: seat.id.toString(),
      seatNumber: seat.seatNumber,
      qrCode: seat.qrCode,
      status: seat.status,
      assignedToId: seat.assignedUserId?.toString() || null,
      assignedTo: seat.assignedUser ? {
        id: seat.assignedUser.id.toString(),
        name: seat.assignedUser.name,
        email: seat.assignedUser.email,
        nickname: null  // User model doesn't have nickname field
      } : null,
      sharedAt: seat.sharedAt?.toISOString() || null,
      sharedBy: seat.sharedBy?.toString() || null,
      checkedInAt: seat.checkedInAt?.toISOString() || null
    }))

    return NextResponse.json({
      ok: true,
      seats,
      canShare: (booking as any).seatAssignments.some((s: any) => !s.checkedInAt)
    })

  } catch (error: any) {
    console.error('Get booking seats error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch booking seats' },
      { status: 500 }
    )
  }
}
