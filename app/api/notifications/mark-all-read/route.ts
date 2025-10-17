import { NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

