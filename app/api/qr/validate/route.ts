import { NextResponse } from 'next/server'
import { getBookingSeatByQr } from '@/lib/db-functions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const qr = body?.qrCode || body?.qr || ''
    if (!qr) return NextResponse.json({ ok: false, error: 'missing qrCode' }, { status: 400 })

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
