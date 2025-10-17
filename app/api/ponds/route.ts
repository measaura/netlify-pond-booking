import { NextResponse } from 'next/server'
import { getPonds } from '@/lib/db-functions'

export async function GET() {
  try {
    const ponds = await getPonds()

    // Normalize shape for client (compat with legacy fields)
    const normalized = ponds.map((p: any) => ({
      id: p.id,
      name: p.name,
      capacity: p.maxCapacity ?? p.capacity ?? 0,
      maxCapacity: p.maxCapacity ?? p.capacity ?? 0,
      price: p.price ?? 0,
      image: p.image ?? '🌊',
      bookingEnabled: p.bookingEnabled ?? true,
      shape: (p.shape || 'RECTANGLE').toLowerCase(),
      seatingArrangement: p.seatingArrangement ?? [5,5,5,5]
    }))

    return NextResponse.json({ ok: true, data: normalized })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch ponds' }, { status: 500 })
  }
}
