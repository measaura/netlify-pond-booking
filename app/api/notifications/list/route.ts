import { NextResponse } from 'next/server'
import { getUserNotifications } from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'

export async function GET(request: Request) {
  try {
    // Derive user from session if possible
    const url = new URL(request.url)
    let uid: number | null = null
    const q = url.searchParams.get('userId')
    if (q) {
      const n = parseInt(q, 10)
      if (!isNaN(n)) uid = n
    }
    if (!uid) uid = getUserIdFromRequest(request)
    if (!uid) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

    const unreadOnly = url.searchParams.get('unread') === 'true'
    const notifs = await getUserNotifications(uid, unreadOnly)
    return NextResponse.json({ notifications: notifs })
  } catch (e) {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
