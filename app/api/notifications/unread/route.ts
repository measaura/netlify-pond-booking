import { NextResponse } from 'next/server'
import { getUserNotifications } from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    // Prefer deriving userId from server-side session/cookies for security and simplicity.
    let uid: number | null = null
    const qUserId = url.searchParams.get('userId')
    if (qUserId) {
      const parsed = parseInt(qUserId, 10)
      if (!isNaN(parsed)) uid = parsed
    }

    if (!uid) {
      const derived = getUserIdFromRequest(request)
      if (derived) uid = derived
    }

    if (!uid) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

    const notifs = await getUserNotifications(uid, true)
    const count = Array.isArray(notifs) ? notifs.length : 0
    return NextResponse.json({ count })
  } catch (err) {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

// Use default Node runtime so Prisma can run (Prisma is not compatible with Edge runtime)
