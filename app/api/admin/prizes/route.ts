import { NextResponse } from 'next/server'
import { getPrizes, createPrize, updatePrize, deletePrize } from '@/lib/db-functions'

export async function GET() {
  try {
    const prizes = await getPrizes()
    return NextResponse.json({ ok: true, data: prizes })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await createPrize(body)
    return NextResponse.json({ ok: true, data: created })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    const updated = await updatePrize(body.id, body)
    return NextResponse.json({ ok: true, data: updated })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    await deletePrize(body.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}
