import { prisma } from '@/lib/db'

export interface TimeSlot {
  scheduledAt: Date
  durationMinutes: number
  available: boolean
}

/**
 * Get Romania's UTC offset in hours for a given date.
 * Romania uses EET (UTC+2) in winter and EEST (UTC+3) in summer.
 * DST starts last Sunday of March, ends last Sunday of October.
 */
function getRomaniaOffsetHours(date: Date): number {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() // 0-based

  // Find last Sunday of March
  const marchLast = new Date(Date.UTC(year, 2, 31))
  while (marchLast.getUTCDay() !== 0) marchLast.setUTCDate(marchLast.getUTCDate() - 1)

  // Find last Sunday of October
  const octLast = new Date(Date.UTC(year, 9, 31))
  while (octLast.getUTCDay() !== 0) octLast.setUTCDate(octLast.getUTCDate() - 1)

  // DST is active from last Sunday of March 03:00 local (01:00 UTC)
  // to last Sunday of October 04:00 local (01:00 UTC)
  const dstStart = new Date(Date.UTC(year, 2, marchLast.getUTCDate(), 1, 0, 0))
  const dstEnd = new Date(Date.UTC(year, 9, octLast.getUTCDate(), 1, 0, 0))

  if (date >= dstStart && date < dstEnd) {
    return 3 // EEST
  }
  return 2 // EET
}

/**
 * Create a UTC Date from a date string and Bucharest local time.
 */
function bucharestToUTC(dateStr: string, hour: number, minute: number): Date {
  // First create as if UTC
  const asUtc = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`)
  // Get Romania offset for this approximate date
  const offset = getRomaniaOffsetHours(asUtc)
  // Subtract offset to convert Bucharest local -> UTC
  return new Date(asUtc.getTime() - offset * 60 * 60 * 1000)
}

/**
 * Get YYYY-MM-DD string for a Date interpreted in Romania timezone.
 */
function dateToRomaniaDateStr(date: Date): string {
  const offset = getRomaniaOffsetHours(date)
  const romaniaTime = new Date(date.getTime() + offset * 60 * 60 * 1000)
  return romaniaTime.toISOString().slice(0, 10)
}

export async function getAvailableSlots(
  startDate: Date,
  endDate: Date
): Promise<Date[]> {
  // Extend range by 1 day on each side to catch dates stored with timezone offset
  const queryStart = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
  const queryEnd = new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
  const availabilities = await prisma.availability.findMany({
    where: {
      active: true,
      date: { gte: queryStart, lte: queryEnd },
    },
  })

  if (availabilities.length === 0) return []

  const bookedSessions = await prisma.session1on1.findMany({
    where: {
      scheduledAt: { gte: queryStart, lte: queryEnd },
      status: 'BOOKED',
    },
  })

  const bookedTimes = new Set(
    bookedSessions.map((s) => s.scheduledAt.getTime())
  )

  const slots: Date[] = []
  const now = new Date()

  for (const av of availabilities) {
    const [startH, startM] = av.startTime.split(':').map(Number)
    const [endH, endM] = av.endTime.split(':').map(Number)

    let hour = startH
    let minute = startM

    // Get the correct date string in Romania timezone
    const dateStr = dateToRomaniaDateStr(av.date)

    while (hour < endH || (hour === endH && minute < endM)) {
      const slotDate = bucharestToUTC(dateStr, hour, minute)

      if (slotDate > now && !bookedTimes.has(slotDate.getTime())) {
        slots.push(slotDate)
      }

      hour += 1
      minute = 0
    }
  }

  return slots.sort((a, b) => a.getTime() - b.getTime())
}

export async function bookSession(
  userId: string,
  scheduledAt: Date,
  durationMinutes: number = 60
): Promise<{ id: string }> {
  const conflict = await prisma.session1on1.findFirst({
    where: {
      scheduledAt,
      status: 'BOOKED',
    },
  })

  if (conflict) {
    throw new Error('Slot already booked')
  }

  const session = await prisma.session1on1.create({
    data: {
      userId,
      scheduledAt,
      duration: durationMinutes,
      status: 'BOOKED',
    },
  })

  return { id: session.id }
}

export async function cancelSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const session = await prisma.session1on1.findFirst({
    where: { id: sessionId, userId },
  })

  if (!session) {
    throw new Error('Session not found')
  }

  const hoursUntilSession =
    (session.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursUntilSession < 24) {
    throw new Error('Cannot cancel within 24 hours')
  }

  await prisma.session1on1.update({
    where: { id: sessionId },
    data: { status: 'CANCELLED' },
  })
}

export async function getUserSessions(userId: string) {
  return prisma.session1on1.findMany({
    where: { userId },
    orderBy: { scheduledAt: 'asc' },
  })
}
