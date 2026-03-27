import { NextResponse } from 'next/server'
import { getAvailableSlots } from '@/services/scheduling'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const start = today
    const end = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)

    const avails = await prisma.availability.findMany({
      where: { active: true },
      orderBy: { date: 'asc' },
    })

    const slots = await getAvailableSlots(start, end)

    return NextResponse.json({
      slots: slots.map((s) => s.toISOString()),
      _debug: {
        serverTime: new Date().toISOString(),
        queryStart: start.toISOString(),
        queryEnd: end.toISOString(),
        totalAvailabilities: avails.length,
        availabilities: avails.map((a) => ({
          id: a.id,
          dateRaw: a.date.toISOString(),
          startTime: a.startTime,
          endTime: a.endTime,
          active: a.active,
        })),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch slots', details: String(error) },
      { status: 500 }
    )
  }
}
