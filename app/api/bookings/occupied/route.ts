import { NextResponse } from 'next/server'
import { getBookings } from '@/lib/db-functions'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const pondIdParam = url.searchParams.get('pondId')
    const eventIdParam = url.searchParams.get('eventId')
    const date = url.searchParams.get('date')
    const timeSlotId = url.searchParams.get('timeSlotId') ? parseInt(url.searchParams.get('timeSlotId')!) : undefined

    if (!date) return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 })

    const occupied: number[] = []

    if (eventIdParam) {
      const eventId = parseInt(eventIdParam)
      const bookings = await getBookings({ eventId, date: new Date(date) })
      bookings.forEach((b: any) => {
        (b.seatAssignments || []).forEach((s: any) => occupied.push(s.seatNumber))
      })
      return NextResponse.json({ ok: true, data: { occupied } })
    }

    const pondId = pondIdParam ? parseInt(pondIdParam) : NaN
    if (!pondId) return NextResponse.json({ ok: false, error: 'missing pondId or eventId' }, { status: 400 })

    const bookings = await getBookings({ pondId, date: new Date(date) })
    bookings.forEach((b: any) => {
      if (timeSlotId && b.timeSlotId !== timeSlotId) return
      (b.seatAssignments || []).forEach((s: any) => occupied.push(s.seatNumber))
    })

    return NextResponse.json({ ok: true, data: { occupied } })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch occupied seats' }, { status: 500 })
  }
}
