import { NextResponse } from 'next/server'
import { generateEventLeaderboard } from '../../../../lib/db-functions'
import prisma from '@/lib/db-functions'

const CACHE_TTL_MS = 60 * 1000 // 60 seconds

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const eventIdParam = url.searchParams.get('eventId')
    if (!eventIdParam) return NextResponse.json({ ok: false, error: 'eventId required' }, { status: 400 })
    const eventId = parseInt(eventIdParam, 10)

    // Try cached EventLeaderboard (gameId null)
    let cached: any = null
    try {
      cached = await prisma.eventLeaderboard.findFirst({
        where: { eventId, gameId: null },
        include: { entries: true }
      })
    } catch (e) {
      cached = null
    }

    if (cached) {
      const age = Date.now() - new Date(cached.lastUpdated).getTime()
      if (age <= CACHE_TTL_MS) {
        const entries = cached.entries.map((e: any) => ({
          userId: e.userId,
          userName: '',
          totalWeight: e.value,
          totalFish: 0,
          biggestFish: e.value,
          averageWeight: e.value,
          competitionsParticipated: 0,
          competitionsWon: 0,
          rank: e.rank,
          points: e.points
        }))
        return NextResponse.json({ ok: true, data: { eventId, eventName: cached.eventId, gameId: null, entries, lastUpdated: cached.lastUpdated } })
      }
    }

    // Compute leaderboard and persist cache
    const board = await generateEventLeaderboard(eventId)

    try {
      const existing = await prisma.eventLeaderboard.findFirst({ where: { eventId, gameId: null } })
      if (existing) {
        await prisma.eventLeaderboard.update({ where: { id: existing.id }, data: { lastUpdated: new Date() } })
      } else {
        await prisma.eventLeaderboard.create({ data: { eventId, gameId: null as any, lastUpdated: new Date() } as any })
      }

      // Refresh entries: delete old, create new
      await prisma.leaderboardEntry.deleteMany({ where: { eventId, gameId: null } })
      const createMany = board.entries.map((ent: any) => ({ eventId, userId: ent.userId, gameId: null as any, value: ent.totalWeight, rank: ent.rank, points: ent.points }))
      if (createMany.length > 0) await prisma.leaderboardEntry.createMany({ data: createMany })
    } catch (e) {
      // ignore cache failures
      console.warn('Failed to persist leaderboard cache', e)
    }

    return NextResponse.json({ ok: true, data: board })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}
