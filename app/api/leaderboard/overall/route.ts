import { NextResponse } from 'next/server'
import { generateOverallLeaderboard } from '../../../../lib/db-functions'

export async function GET() {
  try {
    const data = await generateOverallLeaderboard()
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}
