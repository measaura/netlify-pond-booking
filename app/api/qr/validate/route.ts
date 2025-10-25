import { NextResponse } from 'next/server'
import { getBookingSeatByQr } from '@/lib/db-functions'
import prisma from '@/lib/db-functions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const qr = body?.qrCode || body?.qr || ''
    const type = body?.type || 'seat' // 'seat' or 'rod'
    
    if (!qr) return NextResponse.json({ ok: false, error: 'missing qrCode' }, { status: 400 })

    // Handle rod QR code validation
    if (type === 'rod' || qr.startsWith('ROD-')) {
      const fishingRod = await prisma.fishingRod.findUnique({
        where: { qrCode: qr },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          },
          bookingSeat: {
            include: {
              booking: {
                include: {
                  pond: true,
                  event: true
                }
              },
              assignedUser: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      })

      if (!fishingRod) {
        return NextResponse.json({ ok: false, error: 'Invalid rod QR code' }, { status: 404 })
      }

      if (fishingRod.status !== 'active') {
        return NextResponse.json({ ok: false, error: 'Rod QR code is not active' }, { status: 400 })
      }

      if (!fishingRod.bookingSeat) {
        return NextResponse.json({ ok: false, error: 'Rod is not assigned to any seat' }, { status: 400 })
      }

      return NextResponse.json({
        ok: true,
        data: {
          rod: {
            id: fishingRod.id,
            qrCode: fishingRod.qrCode,
            status: fishingRod.status,
            version: fishingRod.version
          },
          seat: {
            id: fishingRod.bookingSeat.id,
            seatNumber: fishingRod.bookingSeat.seatNumber,
            qrCode: fishingRod.bookingSeat.qrCode,
            status: fishingRod.bookingSeat.status
          },
          booking: fishingRod.bookingSeat.booking,
          assignedUser: fishingRod.bookingSeat.assignedUser || fishingRod.assignedUser,
          checkedIn: !!fishingRod.bookingSeat.checkedInAt
        }
      })
    }

    // Handle seat QR code validation (original logic)
    const seat = await getBookingSeatByQr(qr)
    if (!seat) return NextResponse.json({ ok: false, error: 'invalid QR code' }, { status: 404 })

    // Return seat + booking summary and check-in status
    const checkedIn = (seat.checkInRecords && seat.checkInRecords.length > 0)
    const payload = {
      ok: true,
      data: {
        seat: {
          id: seat.id,
          seatNumber: seat.seatNumber,
          qrCode: seat.qrCode,
          status: seat.status,
        },
        booking: seat.booking ? {
          id: seat.booking.id,
          bookingId: seat.booking.bookingId,
          type: seat.booking.type,
          date: seat.booking.date,
          pond: seat.booking.pond || null,
          event: seat.booking.event || null,
          bookedBy: seat.booking.bookedBy || null,
        } : null,
        assignedUser: seat.assignedUser || null,
        checkedIn,
        checkInRecords: seat.checkInRecords || []
      }
    }

    return NextResponse.json(payload)
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to validate QR' }, { status: 500 })
  }
}
