import { NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'
import { updateStatsAfterCatch } from '@/lib/db-functions'

/**
 * Record catch weight using rod QR
 * POST /api/weighing/record
 * 
 * Body: {
 *   rodQrCode: string,
 *   weight: number,
 *   length?: number,
 *   species?: string,
 *   scaleId?: string,     // Digital scale ID
 *   weighedBy: string,    // Official's name/email
 *   photo?: string,
 *   notes?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rodQrCode, weight, length, species, scaleId, weighedBy, photo, notes } = body

    if (!rodQrCode || weight === undefined || weight === null) {
      return NextResponse.json(
        { ok: false, error: 'Rod QR code and weight are required' },
        { status: 400 }
      )
    }

    if (weight <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Weight must be greater than 0' },
        { status: 400 }
      )
    }

    // Find rod by QR code
    const rod = await prisma.fishingRod.findUnique({
      where: { qrCode: rodQrCode },
      include: {
        bookingSeat: {
          include: {
            booking: {
              include: {
                event: {
                  include: {
                    eventGames: {
                      include: {
                        game: true,
                        prizeSet: {
                          include: {
                            prizes: true
                          }
                        }
                      }
                    }
                  }
                },
                pond: true
              }
            },
            assignedUser: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        assignedUser: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!rod) {
      return NextResponse.json(
        { ok: false, error: 'Invalid rod QR code. Rod not found.' },
        { status: 404 }
      )
    }

    // Verify rod is active
    if (rod.status !== 'active') {
      return NextResponse.json(
        { ok: false, error: `This rod has been ${rod.status}. Cannot record catch.` },
        { status: 400 }
      )
    }

    // Verify seat is checked in
    if (!rod.bookingSeat?.checkedInAt) {
      return NextResponse.json(
        { ok: false, error: 'User must check in before recording catches' },
        { status: 400 }
      )
    }

    const seat = rod.bookingSeat!
    const booking = seat.booking
    const userId = seat.assignedUserId!

    // Check if this is an event booking (requires eventId and gameId)
    if (booking.type !== 'EVENT' || !booking.eventId) {
      return NextResponse.json(
        { ok: false, error: 'Weighing records are only for event bookings' },
        { status: 400 }
      )
    }

    const event = booking.event!

    // Get first game from event (or we could accept gameId in body)
    const eventGame = event.eventGames?.[0]
    if (!eventGame) {
      return NextResponse.json(
        { ok: false, error: 'No game configured for this event' },
        { status: 400 }
      )
    }

    // Create weighing record
    const weighingRecord = await prisma.weighingRecord.create({
      data: {
        rodQrCode,
        userId,
        bookingSeatId: seat.id,
        eventId: event.id,
        gameId: eventGame.gameId,
        weight: parseFloat(weight.toFixed(3)), // 3 decimal places
        length: length ? parseFloat(length.toFixed(1)) : undefined,
        species,
        weighedBy: weighedBy || 'system',
        scaleId,
        photo,
        notes,
        isVerified: true, // From digital scale = auto verified
        weighedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        event: {
          select: { id: true, name: true }
        },
        game: {
          select: { id: true, name: true, type: true }
        }
      }
    })

    // Also create catch record for legacy compatibility
    await prisma.catchRecord.create({
      data: {
        bookingId: booking.id,
        userId,
        eventId: event.id,
        gameId: eventGame.gameId,
        weight: parseFloat(weight.toFixed(3)),
        length: length ? parseFloat(length.toFixed(1)) : undefined,
        species,
        recordedBy: weighedBy || 'system',
        notes,
        isVerified: true
      }
    })

    // Update user stats and check achievements
    const achievementResult = await updateStatsAfterCatch(userId, weight)
    const unlockedAchievements = achievementResult?.newAchievements || []

    // Create achievement notifications
    if (unlockedAchievements.length > 0) {
      await Promise.all(
        unlockedAchievements.map((achievement: any) =>
          prisma.notification.create({
            data: {
              userId,
              type: 'ACHIEVEMENT',
              title: '🎉 Achievement Unlocked!',
              message: `${achievement.name}: ${achievement.description}`,
              actionUrl: '/journey',
              priority: 'high',
            },
          })
        )
      )
    }

    // Create catch notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'CATCH_RECORDED',
        title: '🐟 Catch Recorded!',
        message: `Your catch of ${weight.toFixed(2)}kg has been recorded for ${event.name}`,
        actionUrl: `/leaderboard`,
        priority: 'medium'
      }
    })

    // Get current ranking (simplified)
    const allWeighings = await prisma.weighingRecord.findMany({
      where: {
        eventId: event.id,
        gameId: eventGame.gameId
      },
      orderBy: { weight: 'desc' }
    })

    const userRank = allWeighings.findIndex(w => w.userId === userId) + 1

    return NextResponse.json({
      ok: true,
      data: {
        weighingRecord,
        displayInfo: {
          userName: rod.assignedUser?.name || 'Unknown',
          nickname: rod.assignedUser?.name, // Add nickname field if needed
          weight: weight.toFixed(3),
          length: length?.toFixed(1),
          species,
          seatNumber: seat.seatNumber,
          bookingId: booking.bookingId,
          eventName: event.name,
          gameName: eventGame.game.name
        },
        ranking: {
          currentRank: userRank,
          totalParticipants: allWeighings.length,
          message: userRank === 1 ? '🥇 Current Leader!' : 
                   userRank === 2 ? '🥈 Second Place!' :
                   userRank === 3 ? '🥉 Third Place!' :
                   `Rank #${userRank}`
        },
        achievements: unlockedAchievements
      },
      message: `Catch recorded: ${weight.toFixed(2)}kg for ${rod.assignedUser?.name}`
    })

  } catch (error: any) {
    console.error('Weighing record error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to record catch weight' },
      { status: 500 }
    )
  }
}

/**
 * Get weighing records for an event or user
 * GET /api/weighing/record?eventId=xxx or ?userId=xxx or ?rodQrCode=xxx
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const eventId = url.searchParams.get('eventId')
    const userId = url.searchParams.get('userId')
    const rodQrCode = url.searchParams.get('rodQrCode')

    const where: any = {}
    if (eventId) where.eventId = parseInt(eventId)
    if (userId) where.userId = parseInt(userId)
    if (rodQrCode) where.rodQrCode = rodQrCode

    const records = await prisma.weighingRecord.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        event: {
          select: { id: true, name: true }
        },
        game: {
          select: { id: true, name: true, type: true }
        },
        bookingSeat: {
          select: { seatNumber: true }
        }
      },
      orderBy: { weighedAt: 'desc' }
    })

    return NextResponse.json({
      ok: true,
      data: records,
      count: records.length
    })

  } catch (error: any) {
    console.error('Get weighing records error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to get weighing records' },
      { status: 500 }
    )
  }
}
