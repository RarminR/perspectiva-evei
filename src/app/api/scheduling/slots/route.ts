import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/services/scheduling'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get('debug') === '1'

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const start = searchParams.get('start')
      ? new Date(searchParams.get('start')!)
      : today
    const end = searchParams.get('end')
      ? new Date(searchParams.get('end')!)
      : new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)

    const slots = await getAvailableSlots(start, end)

    if (debug) {
      const avails = await prisma.availability.findMany({
        where: { active: true },
        orderBy: { date: 'asc' },
      })
      return NextResponse.json({
        slots: slots.map((s) => s.toISOString()),
        debug: {
          serverTime: new Date().toISOString(),
          queryStart: start.toISOString(),
          queryEnd: end.toISOString(),
          availabilities: avails.map((a) => ({
            id: a.id,
            dateRaw: a.date.toISOString(),
            startTime: a.startTime,
            endTime: a.endTime,
            active: a.active,
          })),
        },
      })
    }

    return NextResponse.json({ slots: slots.map((s) => s.toISOString()) })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch slots', details: String(error) },
      { status: 500 }
    )
  }
}
