import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  // Clear cookie by setting expired Max-Age
  res.headers.set('Set-Cookie', `session=; Path=/; HttpOnly; Max-Age=0`)
  return res
}
