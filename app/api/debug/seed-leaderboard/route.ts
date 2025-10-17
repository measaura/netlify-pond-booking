import { NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'
import { generateEventLeaderboard } from '@/lib/db-functions'

// WARNING: Dev-only endpoint to quickly seed demo leaderboard data
export async function POST() {
  try {
    // Create a demo event (fallback to an existing event on failure)
    let event: any = null
    try {
      event = await prisma.event.create({
        data: {
          name: `Demo Leaderboard Event ${Date.now()}`,
          description: 'Auto-generated demo event for leaderboard testing',
          date: new Date(),
          startTime: '09:00',
          endTime: '17:00',
          maxParticipants: 100,
          maxSeatsPerBooking: 6,
          entryFee: 0,
          bookingOpens: new Date(),
          status: 'open'
        } as any
      })
    } catch (e) {
      // If create fails (sequence/unique issues), fallback to an existing event
      event = await prisma.event.findFirst()
      if (!event) throw e
    }

    // Create an associated pond (if none exists pick first pond)
    let pondId: number | null = null
    const pond = await prisma.pond.findFirst()
    if (pond) pondId = pond.id
    else {
      const p = await prisma.pond.create({ data: { name: 'Demo Pond', maxCapacity: 50, price: 0, shape: 'RECTANGLE' } as any })
      pondId = p.id
    }

    // link event to pond
    await prisma.eventPond.create({ data: { eventId: event.id, pondId } })

    // Ensure some users exist (look up first 4 users)
    const users = await prisma.user.findMany({ take: 4 })

    // Create bookings for each user and some catches
    for (let i = 0; i < users.length; i++) {
      const u = users[i]
      const bookingId = `DBG_${Date.now()}_${u.id}_${i}`
      const booking = await prisma.booking.create({
        data: {
          bookingId,
          type: 'EVENT',
          bookedByUserId: u.id,
          pondId,
          eventId: event.id,
          date: new Date(),
          seatsBooked: 1,
          totalPrice: 0
        } as any
      })

      // create a seat assignment
      const seat = await prisma.bookingSeat.create({
        data: {
          bookingId: booking.id,
          seatNumber: 1,
          assignedUserId: u.id,
          qrCode: `DBG_SEAT_${booking.id}_${u.id}_${Date.now()}`
        } as any
      })

      // create some catch records with varying weights
      const catches = [1.2 + i * 0.5, 0.8 + i * 0.3, 2.0 + i * 0.4]
      for (const w of catches) {
        await prisma.catchRecord.create({
          data: {
            bookingId: booking.id,
            userId: u.id,
            eventId: event.id,
            gameId: null,
            rodQrCode: null,
            weight: w,
            length: null,
            species: 'Trout',
            photo: null,
            isVerified: true,
            recordedBy: 'debug-seed',
            notes: 'auto-generated'
          } as any
        })
      }
    }

    const board = await generateEventLeaderboard(event.id)
    return NextResponse.json({ ok: true, data: board })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}
