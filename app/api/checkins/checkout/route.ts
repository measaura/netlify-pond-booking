import { NextResponse } from 'next/server'
import { checkOutByCheckInId } from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const checkInId = Number(body?.checkInId || body?.id)
    if (!checkInId) return NextResponse.json({ ok: false, error: 'missing checkInId' }, { status: 400 })

    const scannedBy = await getUserIdFromRequest(request) || 'system'
    const updated = await checkOutByCheckInId(checkInId, `user:${scannedBy}`)
    return NextResponse.json({ ok: true, data: updated })
  } catch (e: any) {
    console.error('Checkout error', e)
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
