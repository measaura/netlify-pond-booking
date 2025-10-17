import { NextResponse } from 'next/server'
import { markBookingNoShow } from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const bookingId = body?.bookingId || body?.bookingIdString
    if (!bookingId) return NextResponse.json({ ok: false, error: 'missing bookingId' }, { status: 400 })

    const userId = await getUserIdFromRequest(request) || 'system'
    const res = await markBookingNoShow(bookingId, `user:${userId}`)
    return NextResponse.json({ ok: true, data: res })
  } catch (e: any) {
    console.error('Mark no-show error', e)
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
