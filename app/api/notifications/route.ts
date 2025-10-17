// Cleaned notification route handlers (server runtime)
import { NextResponse } from 'next/server'
import { createNotification } from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'
import prisma from '@/lib/db-functions'

// POST /api/notifications -> create a notification for the current session user
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const { type, title, message, priority = 'medium', actionUrl } = body || {}
    if (!type || !title || !message) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const notif = await createNotification({ userId, type, title, message, priority, actionUrl })
    return NextResponse.json({ ok: true, notification: notif })
  } catch (e) {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

// DELETE /api/notifications?id=NN -> delete a notification owned by the current user
export async function DELETE(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const idStr = url.searchParams.get('id')
    if (!idStr) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    const id = parseInt(idStr, 10)
    if (isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

    const notif = await prisma.notification.findUnique({ where: { id } })
    if (!notif) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (notif.userId !== userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    await prisma.notification.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

