import { NextResponse } from 'next/server'
import { getTimeSlots } from '@/lib/db-functions'

export async function GET() {
  try {
    const slots = await getTimeSlots()
    return NextResponse.json({ ok: true, data: slots })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch time slots' }, { status: 500 })
  }
}
