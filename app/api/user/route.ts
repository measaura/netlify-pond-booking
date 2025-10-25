import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/user?email=user@example.com
 * Fetches a user by email address to get their database ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, data: user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * POST /api/user
 * Creates a new user for testing purposes
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, phone, role } = body

    if (!email || !name) {
      return NextResponse.json(
        { ok: false, error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ ok: true, data: existingUser })
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role || 'USER',
      },
    })

    return NextResponse.json({ ok: true, data: user })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create user' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
