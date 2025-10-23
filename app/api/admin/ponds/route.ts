import { NextResponse } from 'next/server'
import { getPonds, getPondById, createPond, updatePond, deletePond, getUserById } from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'

export async function GET(request: Request) {
  try {
    // Admin-only: require a logged-in admin user
    const uid = getUserIdFromRequest(request) || null
    if (!uid) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    const user = await getUserById(uid)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    const ponds = await getPonds()
    return NextResponse.json({ ok: true, data: ponds })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const uid = getUserIdFromRequest(request) || null
    if (!uid) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    const user = await getUserById(uid)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    // basic validation
    if (!body?.name || typeof body.maxCapacity !== 'number' || typeof body.price !== 'number') {
      return NextResponse.json({ ok: false, error: 'Invalid pond payload' }, { status: 400 })
    }

    const created = await createPond(body)
    return NextResponse.json({ ok: true, data: created })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const uid = getUserIdFromRequest(request) || null
    console.log('[PUT /api/admin/ponds] userId from request:', uid)
    
    if (!uid) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    
    const user = await getUserById(uid)
    console.log('[PUT /api/admin/ponds] user found:', user ? { id: user.id, email: user.email, role: user.role } : null)
    
    if (!user) return NextResponse.json({ ok: false, error: 'Forbidden - User not found' }, { status: 403 })
    if (user.role !== 'ADMIN') return NextResponse.json({ ok: false, error: `Forbidden - Role ${user.role} is not ADMIN` }, { status: 403 })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    const updated = await updatePond(body.id, body)
    return NextResponse.json({ ok: true, data: updated })
  } catch (error) {
    console.error('[PUT /api/admin/ponds] Error:', error)
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const uid = getUserIdFromRequest(request) || null
    if (!uid) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    const user = await getUserById(uid)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    await deletePond(body.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}
