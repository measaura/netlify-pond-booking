import { NextResponse } from 'next/server'
import { recordCatch, generateOverallLeaderboard } from '@/lib/db-functions'
import prisma from '@/lib/db-functions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bookingId, weight, notes, weighedBy, stationId } = body

    if (!bookingId || weight === undefined || weight === null) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID and weight are required' },
        { status: 400 }
      )
    }

    if (weight <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Weight must be greater than 0' },
        { status: 400 }
      )
    }

    // Get booking details to find user and event info
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) }
    })

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Record the catch
    const catchRecord = await recordCatch({
      bookingId: parseInt(bookingId),
      userId: booking.bookedByUserId,
      eventId: booking.eventId || undefined,
      weight: parseFloat(weight),
      notes,
      recordedBy: weighedBy || 'kiosk'
    })

    // Get updated leaderboard to find user's ranking
    const leaderboard = await generateOverallLeaderboard()
    const userRanking = leaderboard.find(entry => entry.userId === booking.bookedByUserId)
    const userRank = leaderboard.findIndex(entry => entry.userId === booking.bookedByUserId) + 1

    return NextResponse.json({
      ok: true,
      data: {
        catchRecord,
        userRanking: {
          rank: userRank,
          totalCatches: userRanking?.totalFish || 1,
          totalWeight: userRanking?.totalWeight || weight,
          biggestCatch: userRanking?.biggestFish || weight,
          averageWeight: userRanking?.averageWeight || weight
        },
        leaderboardSize: leaderboard.length
      },
      message: `Weight ${weight}kg recorded successfully`
    })

  } catch (error: any) {
    console.error('Weight submission error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to submit weight' },
      { status: 500 }
    )
  }
}