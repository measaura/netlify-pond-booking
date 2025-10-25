import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'

// GET /api/user/[userId]/stats - Get user statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdStr } = await params
    const userId = parseInt(userIdStr)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Get or create user stats
    let stats = await prisma.userStats.findUnique({
      where: {
        userId,
      },
    })

    // If user stats don't exist, create them
    if (!stats) {
      stats = await prisma.userStats.create({
        data: {
          userId,
          totalSessions: 0,
          totalBookings: 0,
          totalCatches: 0,
          eventsJoined: 0,
          competitionsWon: 0,
          totalPrizeMoney: 0,
          currentStreak: 0,
          longestStreak: 0,
          morningSlots: 0,
          eveningSlots: 0,
          groupSessions: 0,
        },
      })
    }

    return NextResponse.json(stats)
  } catch (error) {
    const { userId: userIdStr } = await params
    console.error(`GET /api/user/${userIdStr}/stats - Error:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}

// PUT /api/user/[userId]/stats - Update user statistics
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdStr } = await params
    const userId = parseInt(userIdStr)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const updates = await request.json()

    const stats = await prisma.userStats.upsert({
      where: {
        userId,
      },
      update: {
        ...updates,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        ...updates,
      },
    })

    return NextResponse.json(stats)
  } catch (error) {
    const { userId: userIdStr } = await params
    console.error(`PUT /api/user/${userIdStr}/stats - Error:`, error)
    return NextResponse.json(
      { error: 'Failed to update user stats' },
      { status: 500 }
    )
  }
}
