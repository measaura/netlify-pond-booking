import { NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'
import { signSession } from '../../../../lib/server-auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body
    if (!email || !password) return NextResponse.json({ ok: false, error: 'email and password required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })

    // In dev mode we compare plaintext (seeded users use plaintext passwords in prisma/seed)
    if (user.password !== password) return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })

    const token = signSession({ userId: user.id, email: user.email, role: user.role })

    const res = NextResponse.json({ ok: true, data: { userId: user.id, email: user.email } })
    // Set cookie (httpOnly) for server-side requests; keep path=/ and reasonable expiry (7 days)
    res.headers.set('Set-Cookie', `session=${token}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 7}`)
    return res
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 })
  }
}
