import { NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const userIdParam = url.searchParams.get('userId')
    if (!userIdParam) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 })
    const userId = parseInt(userIdParam, 10)

    // Find events where the user has catchRecords
    const catchEvents = await prisma.catchRecord.findMany({ where: { userId }, select: { eventId: true }, distinct: ['eventId'] })
    const eventIdsFromCatches = catchEvents.map(e => e.eventId).filter(Boolean) as number[]

    // Also include events where the user has bookings
    const bookings = await prisma.booking.findMany({ where: { bookedByUserId: userId }, select: { eventId: true }, distinct: ['eventId'] })
    const eventIdsFromBookings = bookings.map(b => b.eventId).filter(Boolean) as number[]

    const eventIds = Array.from(new Set([...eventIdsFromCatches, ...eventIdsFromBookings]))

    const events = await prisma.event.findMany({ where: { id: { in: eventIds } }, orderBy: { date: 'desc' } })
    return NextResponse.json({ ok: true, data: events })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}
