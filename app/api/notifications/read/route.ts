import { NextResponse } from 'next/server'
import { markNotificationAsRead } from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const id = body?.id
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    // Mark as read (db function will verify existence)
    await markNotificationAsRead(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
