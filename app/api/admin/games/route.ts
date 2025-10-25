import { NextResponse } from 'next/server'
import { getGames, createGame, updateGame, deleteGame } from '@/lib/db-functions'

export async function GET() {
  try {
    const games = await getGames()
    return NextResponse.json({ ok: true, data: games })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('POST /api/admin/games - Received body:', JSON.stringify(body, null, 2))
    const created = await createGame(body)
    return NextResponse.json({ ok: true, data: created })
  } catch (error) {
    console.error('POST /api/admin/games - Error:', error)
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    const updated = await updateGame(body.id, body)
    return NextResponse.json({ ok: true, data: updated })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    await deleteGame(body.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}
