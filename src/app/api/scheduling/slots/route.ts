import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/services/scheduling'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
      ? new Date(searchParams.get('start')!)
      : new Date()
    const end = searchParams.get('end')
      ? new Date(searchParams.get('end')!)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    const slots = await getAvailableSlots(start, end)
    return NextResponse.json({ slots: slots.map((s) => s.toISOString()) })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 }
    )
  }
}
