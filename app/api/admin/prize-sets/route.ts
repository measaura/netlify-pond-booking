import { NextRequest, NextResponse } from 'next/server'
import { getPrizeSets, getPrizeSetById, createPrizeSet, updatePrizeSet, deletePrizeSet } from '@/lib/db-functions'

// GET /api/admin/prize-sets - Get all prize sets
export async function GET(request: NextRequest) {
  try {
    const prizeSets = await getPrizeSets()
    return NextResponse.json({ ok: true, data: prizeSets })
  } catch (error: any) {
    console.error('Error fetching prize sets:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// POST /api/admin/prize-sets - Create a new prize set
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, isActive } = body
    
    if (!name) {
      return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 })
    }

    const prizeSet = await createPrizeSet({ name, description, isActive })
    return NextResponse.json({ ok: true, data: prizeSet })
  } catch (error: any) {
    console.error('Error creating prize set:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// PUT /api/admin/prize-sets - Update a prize set
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Prize set ID is required' }, { status: 400 })
    }

    const prizeSet = await updatePrizeSet(id, updateData)
    return NextResponse.json({ ok: true, data: prizeSet })
  } catch (error: any) {
    console.error('Error updating prize set:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/prize-sets - Delete a prize set
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Prize set ID is required' }, { status: 400 })
    }

    await deletePrizeSet(id)
    return NextResponse.json({ ok: true, message: 'Prize set deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting prize set:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
