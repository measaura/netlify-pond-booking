import { NextResponse } from 'next/server'
import prisma from '@/lib/db-functions'

/**
 * Webhook endpoint for digital scale to push weight data
 * POST /api/webhooks/scale
 * 
 * Body: {
 *   scaleId: string,
 *   weight: number,
 *   unit: string,      // 'kg' or 'g'
 *   timestamp: string,
 *   sessionId?: string // Optional session tracking
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { scaleId, weight, unit, timestamp, sessionId } = body

    if (!scaleId || weight === undefined) {
      return NextResponse.json(
        { ok: false, error: 'Scale ID and weight are required' },
        { status: 400 }
      )
    }

    // Convert to kg if needed
    let weightKg = weight
    if (unit === 'g') {
      weightKg = weight / 1000
    }

    // Store scale reading (could be used for audit trail)
    // For now, just acknowledge receipt
    console.log(`[Scale ${scaleId}] Weight reading: ${weightKg}kg at ${timestamp}`)

    return NextResponse.json({
      ok: true,
      data: {
        scaleId,
        weight: weightKg,
        unit: 'kg',
        receivedAt: new Date().toISOString(),
        sessionId
      },
      message: 'Weight reading received successfully'
    })

  } catch (error: any) {
    console.error('Scale webhook error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to process scale data' },
      { status: 500 }
    )
  }
}

/**
 * Webhook endpoint for label printer status updates
 * POST /api/webhooks/printer
 * 
 * Body: {
 *   printerId: string,
 *   status: string,    // 'ready', 'printing', 'error', 'out_of_paper'
 *   jobId?: string,
 *   errorMessage?: string
 * }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { printerId, status, jobId, errorMessage } = body

    if (!printerId || !status) {
      return NextResponse.json(
        { ok: false, error: 'Printer ID and status are required' },
        { status: 400 }
      )
    }

    console.log(`[Printer ${printerId}] Status: ${status}${jobId ? ` (Job: ${jobId})` : ''}`)

    if (status === 'error' && errorMessage) {
      console.error(`[Printer ${printerId}] Error: ${errorMessage}`)
    }

    // Could store printer status in database for monitoring
    // await prisma.printerStatus.upsert(...)

    return NextResponse.json({
      ok: true,
      data: {
        printerId,
        status,
        acknowledgedAt: new Date().toISOString()
      },
      message: 'Printer status updated'
    })

  } catch (error: any) {
    console.error('Printer webhook error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to process printer status' },
      { status: 500 }
    )
  }
}
