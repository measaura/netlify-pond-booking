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
      maxSeatsPerBooking: e.maxSeatsPerBooking,
      entryFee: e.entryFee,
      bookingOpens: e.bookingOpens,
      status: e.status,
      assignedPonds: (e.eventPonds || []).map((ep: any) => ep.pondId),
      pondNames: (e.eventPonds || []).map((ep: any) => ep.pond?.name || 'Unknown Pond'),
      participants: e.bookings?.length || 0, // Count of bookings for this event
      // Include eventGames with full prize information
      eventGames: (e.eventGames || []).map((eg: any) => ({
        id: eg.id,
        gameId: eg.gameId,
        customGameName: eg.customGameName,
        displayOrder: eg.displayOrder,
        game: eg.game,
        gameTemplate: eg.gameTemplate,
        prizeSet: {
          id: eg.prizeSet?.id,
          name: eg.prizeSet?.name,
          prizes: (eg.prizeSet?.prizes || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            value: p.value,
            rankStart: p.rankStart,
            rankEnd: p.rankEnd,
            description: p.description
          }))
        }
      })),
      // Keep old games structure for backward compatibility (but it will be empty)
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
