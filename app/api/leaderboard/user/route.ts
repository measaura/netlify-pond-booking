import { NextResponse } from 'next/server'
import { getUserLeaderboardStats } from '../../../../lib/db-functions'
import { getUserIdFromRequest } from '../../../../lib/server-auth'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    // Prefer server-derived session user id (cookie-based or other server-auth helpers)
    const sessionUserId = getUserIdFromRequest(req)
    // Back-compat: query param or header may be used in dev
    const headerUser = req.headers.get('x-user-id')
    const userIdParam = sessionUserId ? String(sessionUserId) : headerUser ?? url.searchParams.get('userId')
    if (!userIdParam) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 })
    const userId = parseInt(userIdParam, 10)
    const stats = await getUserLeaderboardStats(userId)
    return NextResponse.json({ ok: true, data: stats })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}
