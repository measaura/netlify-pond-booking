import { NextResponse } from 'next/server'
import { checkInSeat, getBookingSeatByQr } from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const qr = body?.qrCode || body?.qr || ''
    if (!qr) return NextResponse.json({ ok: false, error: 'missing qrCode' }, { status: 400 })

    // Determine scannedBy for audit; prefer authenticated userId, fallback to header
    const scannedById = getUserIdFromRequest(request)
    const scannedBy = scannedById ? `user:${scannedById}` : (request.headers.get('x-user-id') ? `user:${request.headers.get('x-user-id')}` : 'anonymous')

    // Ensure seat exists
    const seat = await getBookingSeatByQr(qr)
    if (!seat) return NextResponse.json({ ok: false, error: 'invalid QR code' }, { status: 404 })

    // call db helper to perform check-in
    const record = await checkInSeat(qr, scannedBy)
    return NextResponse.json({ ok: true, data: record })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to check-in' }, { status: 500 })
  }
}
