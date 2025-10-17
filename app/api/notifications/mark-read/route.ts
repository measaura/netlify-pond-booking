import { NextResponse } from 'next/server'
import { markNotificationAsRead } from '@/lib/db-functions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = body.id
    if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 })
    await markNotificationAsRead(parseInt(id, 10))
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
