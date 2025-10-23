import { NextResponse } from 'next/server'
import { getBookings } from '@/lib/db-functions'
import { getUserIdFromRequest } from '@/lib/server-auth'
import prisma from '@/lib/db-functions'

export async function GET(request: Request) {
  try {
    // Check if user is admin
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get all bookings without filters
    const bookings = await getBookings()
    
    return NextResponse.json({ ok: true, data: bookings })
  } catch (err: any) {
    console.error('Error fetching admin bookings:', err)
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch bookings' }, { status: 500 })
  }
}
