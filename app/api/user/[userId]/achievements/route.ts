import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'

// GET /api/user/[userId]/achievements - Get user's unlocked achievements
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

    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId,
      },
      include: {
        achievement: true,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    })

    return NextResponse.json(userAchievements)
  } catch (error) {
    const { userId: userIdStr } = await params
    console.error(`GET /api/user/${userIdStr}/achievements - Error:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch user achievements' },
      { status: 500 }
    )
  }
}
