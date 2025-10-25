import { NextResponse } from 'next/server'
import { getEvents, getEventById, createEvent, updateEvent as dbUpdateEvent, deleteEvent } from '@/lib/db-functions'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const idParam = url.searchParams.get('id')
    if (idParam) {
      const ev = await getEventById(Number(idParam))
      return NextResponse.json({ ok: true, data: ev })
    }

    const events = await getEvents()
    return NextResponse.json({ ok: true, data: events })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('POST /api/admin/events - Received body:', JSON.stringify(body, null, 2))
    const created = await createEvent(body)
    console.log('POST /api/admin/events - Created event:', created?.id)
    return NextResponse.json({ ok: true, data: created })
  } catch (error) {
    console.error('POST /api/admin/events - Error:', error)
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    const updated = await dbUpdateEvent(body.id, body)
    return NextResponse.json({ ok: true, data: updated })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    await deleteEvent(body.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}
