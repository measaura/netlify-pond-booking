import { NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'
import { randomBytes } from 'crypto'

/**
 * Generate and print rod QR label
 * POST /api/rod-printing/print
 * 
 * Body: {
 *   seatQrCode: string,    // Seat QR to identify user
 *   stationId: string,     // Printer station ID
 *   isReplacement: boolean // true if replacing existing rod
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { seatQrCode, stationId, isReplacement } = body

    if (!seatQrCode || !stationId) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: seatQrCode, stationId' },
        { status: 400 }
      )
    }

    // Find seat by QR code
    const seat = await prisma.bookingSeat.findUnique({
      where: { qrCode: seatQrCode },
      include: {
        booking: {
          include: {
            event: true,
            pond: true
          }
        },
        assignedUser: true,
        fishingRod: true
      }
    })

    if (!seat) {
      return NextResponse.json(
        { ok: false, error: 'Invalid seat QR code' },
        { status: 404 }
      )
    }

    // Verify seat is checked in
    if (!seat.checkedInAt) {
      return NextResponse.json(
        { ok: false, error: 'User must check in before rod label printing' },
        { status: 400 }
      )
    }

    // Check if rod already exists and is active
    if (seat.fishingRod && seat.fishingRod.status === 'active' && !isReplacement) {
      return NextResponse.json({
        ok: false,
        error: 'Rod label already printed for this seat',
        existingRod: seat.fishingRod,
        hint: 'Set isReplacement=true to print a replacement label'
      }, { status: 400 })
    }

    // Generate unique rod QR code
    const rodQrCode = `ROD-${seat.booking.bookingId}-S${seat.seatNumber}-${randomBytes(4).toString('hex').toUpperCase()}`

    // If replacement, void the old rod
    let previousRodQr: string | undefined
    if (seat.fishingRod && isReplacement) {
      await prisma.fishingRod.update({
        where: { id: seat.fishingRod.id },
        data: {
          status: 'voided',
          voidedAt: new Date(),
          voidReason: isReplacement ? 'Replacement label issued' : 'Rod changed'
        }
      })
      previousRodQr = seat.fishingRod.qrCode
    }

    // Create new rod record
    const newRod = await prisma.fishingRod.create({
      data: {
        qrCode: rodQrCode,
        bookingSeatId: seat.id,
        assignedUserId: seat.assignedUserId!,
        version: seat.fishingRod ? seat.fishingRod.version + 1 : 1,
        status: 'active',
        printedAt: new Date(),
        previousQrCode: previousRodQr,
        printStationId: stationId,
        selfPrinted: false
      }
    })

    // Create print session record
    const printSession = await prisma.rodPrintSession.create({
      data: {
        scannedQrCode: seatQrCode,
        bookingSeatId: seat.id,
        userId: seat.assignedUserId!,
        stationId,
        sessionStatus: 'completed',
        eventValid: true,
        validationMessage: 'Rod label printed successfully',
        rodQrCode: rodQrCode,
        printedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: seat.assignedUserId!,
        type: 'ROD_PRINTED',
        title: '🎣 Rod Label Printed!',
        message: `Your fishing rod label has been printed. Rod ID: ${rodQrCode.slice(0, 16)}...`,
        actionUrl: `/bookings`,
        priority: 'medium'
      }
    })

    return NextResponse.json({
      ok: true,
      data: {
        rod: newRod,
        printSession,
        user: {
          name: seat.assignedUser?.name,
          email: seat.assignedUser?.email,
          seatNumber: seat.seatNumber,
          bookingId: seat.booking.bookingId
        },
        labelData: {
          qrCode: rodQrCode,
          userName: seat.assignedUser?.name,
          seatNumber: seat.seatNumber,
          bookingId: seat.booking.bookingId,
          eventName: seat.booking.event?.name || seat.booking.pond?.name,
          pondName: seat.booking.pond?.name, // Add specific pond name
          date: seat.booking.date.toISOString().split('T')[0],
          version: newRod.version
        },
        replacementInfo: isReplacement ? {
          previousRod: previousRodQr,
          reason: 'Replacement issued'
        } : null
      },
      message: isReplacement 
        ? `Replacement rod label printed for ${seat.assignedUser?.name}`
        : `Rod label printed for ${seat.assignedUser?.name}`
    })

  } catch (error: any) {
    console.error('Rod printing error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Rod printing failed' },
      { status: 500 }
    )
  }
}

/**
 * Get rod status by QR code
 * GET /api/rod-printing/print?qrCode=xxx
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

    const rod = await prisma.fishingRod.findUnique({
      where: { qrCode },
      include: {
        bookingSeat: {
          include: {
            booking: {
              include: {
                event: true,
                pond: true
              }
            },
            assignedUser: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        assignedUser: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!rod) {
      return NextResponse.json(
        { ok: false, error: 'Rod not found with this QR code' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        rod,
        isValid: rod.status === 'active',
        isVoided: rod.status === 'voided',
        user: rod.assignedUser,
        seat: rod.bookingSeat,
        booking: rod.bookingSeat?.booking
      }
    })

  } catch (error: any) {
    console.error('Get rod status error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to get rod status' },
      { status: 500 }
    )
  }
}
