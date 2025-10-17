import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/server-auth'
import { getUserById } from '@/lib/db-functions'

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ user: null })

    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ user: null })

    // Return a lean user object for client consumption
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (e) {
    return NextResponse.json({ user: null })
  }
}
