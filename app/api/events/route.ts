import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/db-functions'

export async function GET() {
  try {
    const events = await getEvents()
    const normalized = events.map((e: any) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      maxParticipants: e.maxParticipants,
      entryFee: e.entryFee,
      bookingOpens: e.bookingOpens,
      status: e.status,
      assignedPonds: (e.eventPonds || []).map((ep: any) => ep.pondId),
      games: (e.games || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        type: g.type,
        measurementUnit: g.measurementUnit,
        targetValue: g.targetWeight ?? g.targetValue,
        decimalPlaces: g.decimalPlaces,
        description: g.description,
        prizes: g.prizes || [],
      }))
    }))

    return NextResponse.json({ ok: true, data: normalized })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch events' }, { status: 500 })
  }
}
