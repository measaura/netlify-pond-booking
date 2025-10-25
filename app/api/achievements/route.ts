import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'

// GET /api/achievements - Get all achievements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') === 'true'

    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (activeOnly) {
      where.isActive = true
    }

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return NextResponse.json(achievements)
  } catch (error) {
    console.error('GET /api/achievements - Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}
