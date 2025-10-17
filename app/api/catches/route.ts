import { NextResponse } from 'next/server'
import { getCatchRecords } from '@/lib/db-functions'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const userIdParam = url.searchParams.get('userId')
    const eventIdParam = url.searchParams.get('eventId')

    const filters: any = {}
    if (userIdParam) filters.userId = parseInt(userIdParam, 10)
    if (eventIdParam) filters.eventId = parseInt(eventIdParam, 10)

    const records = await getCatchRecords(filters)
    return NextResponse.json({ ok: true, data: records })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}
