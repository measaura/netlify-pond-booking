import { NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'
import { formatDate } from '@/lib/utils'

/**
 * Check-in a user with their seat QR code
 * POST /api/checkins/scan
 * 
 * Body: {
 *   qrCode: string,      // Seat QR code
 *   scannedBy: string,   // Official's email/name
 *   stationId: string    // Check-in station ID
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { qrCode, scannedBy, stationId } = body

    if (!qrCode) {
      return NextResponse.json(
        { ok: false, error: 'QR code is required' },
        { status: 400 }
      )
    }

    // Find seat by QR code
    const seat = await prisma.bookingSeat.findUnique({
      where: { qrCode },
      include: {
        booking: {
          include: {
            event: true,
            pond: true,
            bookedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        assignedUser: {
          select: { id: true, name: true, email: true }
        },
        fishingRod: {
          select: { qrCode: true, status: true, version: true }
        }
      }
    })

    if (!seat) {
      return NextResponse.json(
        { ok: false, error: 'Invalid QR code. Seat not found.' },
        { status: 404 }
      )
    }

    // Check if seat has been assigned to a user
    if (!seat.assignedUserId) {
      return NextResponse.json(
        { ok: false, error: 'This seat has not been assigned to a user yet.' },
        { status: 400 }
      )
    }

    // Check if already checked in
    if (seat.checkedInAt) {
      return NextResponse.json({
        ok: true,
        alreadyCheckedIn: true,
        data: {
          seat: {
            id: seat.id,
            seatNumber: seat.seatNumber,
            qrCode: seat.qrCode,
            status: seat.status
          },
          user: {
            id: seat.assignedUser?.id,
            name: seat.assignedUser?.name,
            email: seat.assignedUser?.email,
            nickname: seat.assignedUser?.name
          },
          booking: {
            id: seat.booking.id,
            bookingId: seat.booking.bookingId,
            seatNumber: seat.seatNumber,
            type: seat.booking.type,
            event: seat.booking.event?.name,
            pond: seat.booking.pond?.name,
            date: seat.booking.date
          },
          needsRodPrint: false, // Already checked in, probably already has rod
          existingRod: seat.fishingRod,
          checkInTime: seat.checkedInAt,
          message: `Already checked in at ${seat.checkedInAt.toLocaleString()}`
        }
      })
    }

    // Verify booking date - check-in only valid on the event day
    const now = new Date()
    const bookingDate = new Date(seat.booking.date)
    
    // Set both dates to start of day for accurate comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const eventDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate())
    
    if (today.getTime() !== eventDay.getTime()) {
      const isBeforeEvent = today < eventDay
      const isAfterEvent = today > eventDay
      
      let errorMessage = `This booking is for ${formatDate(bookingDate)}. `
      if (isBeforeEvent) {
        errorMessage += 'Check-in is only available on the event day itself.'
      } else if (isAfterEvent) {
        errorMessage += 'This event has already passed.'
      }
      
      return NextResponse.json({
        ok: false,
        error: errorMessage,
        eventDate: formatDate(bookingDate),
        currentDate: formatDate(now)
      }, { status: 400 })
    }

    // Perform check-in
    const [updatedSeat, checkInRecord] = await prisma.$transaction([
      // Update seat status
      prisma.bookingSeat.update({
        where: { id: seat.id },
        data: {
          status: 'checked-in',
          checkedInAt: new Date()
        },
        include: {
          assignedUser: true,
          booking: {
            include: {
              event: true,
              pond: true
            }
          }
        }
      }),

      // Create check-in record
      prisma.checkInRecord.create({
        data: {
          bookingId: seat.bookingId,
          userId: seat.assignedUserId,
          bookingSeatId: seat.id,
          checkInAt: new Date(),
          scannedBy: scannedBy || 'system',
          status: 'checked-in'
        }
      })
    ])

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: seat.assignedUserId,
        type: 'CHECK_IN',
        title: '✅ Checked In Successfully!',
        message: `You have been checked in for Seat #${seat.seatNumber}. Proceed to rod label printing.`,
        actionUrl: `/bookings`,
        priority: 'medium'
      }
    })

    return NextResponse.json({
      ok: true,
      data: {
        seat: updatedSeat,
        checkInRecord,
        user: {
          id: updatedSeat.assignedUser?.id,
          name: updatedSeat.assignedUser?.name,
          email: updatedSeat.assignedUser?.email,
          nickname: updatedSeat.assignedUser?.name  // Can add nickname field to User model
        },
        booking: {
          id: updatedSeat.booking.id,
          bookingId: updatedSeat.booking.bookingId,
          seatNumber: seat.seatNumber,
          type: updatedSeat.booking.type,
          event: updatedSeat.booking.event?.name,
          pond: updatedSeat.booking.pond?.name,
          date: updatedSeat.booking.date
        },
        needsRodPrint: !seat.fishingRod || seat.fishingRod.status === 'voided',
        existingRod: seat.fishingRod
      },
      message: `Welcome ${updatedSeat.assignedUser?.name}! Checked in to Seat #${seat.seatNumber}`
    })

  } catch (error: any) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Check-in failed' },
      { status: 500 }
    )
  }
}

/**
 * Get check-in status by QR code
 * GET /api/checkins/scan?qrCode=xxx
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const qrCode = url.searchParams.get('qrCode')

    if (!qrCode) {
      return NextResponse.json(
        { ok: false, error: 'QR code is required' },
        { status: 400 }
      )
    }

    const seat = await prisma.bookingSeat.findUnique({
      where: { qrCode },
      include: {
        booking: {
          include: {
            event: true,
            pond: true
          }
        },
        assignedUser: {
          select: { id: true, name: true, email: true }
        },
        fishingRod: true,
        checkInRecords: {
          orderBy: { checkInAt: 'desc' },
          take: 1
        }
      }
    })

    if (!seat) {
      return NextResponse.json(
        { ok: false, error: 'Invalid QR code' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        seat,
        isCheckedIn: !!seat.checkedInAt,
        hasRod: !!seat.fishingRod,
        latestCheckIn: seat.checkInRecords[0] || null
      }
    })

  } catch (error: any) {
    console.error('Get check-in status error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to get check-in status' },
      { status: 500 }
    )
  }
}
