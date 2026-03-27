import { prisma } from '@/lib/db'

export interface TimeSlot {
  scheduledAt: Date
  durationMinutes: number
  available: boolean
}

/**
 * Convert a date string (YYYY-MM-DD) and local Bucharest hour/minute
 * to a proper UTC Date object.
 */
function bucharestToUTC(dateStr: string, hour: number, minute: number): Date {
  // Create an ISO string with the Bucharest time, then use the timezone
  // offset to compute the correct UTC timestamp
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
  // Parse as UTC first to get a reference point
  const utcRef = new Date(`${dateStr}T${timeStr}Z`)
  // Format that UTC instant as Bucharest local time
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bucharest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(utcRef)
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '0'
  const bucharestAtUtcRef = new Date(
    `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`
  )
  // The offset is the difference: Bucharest = UTC + offset
  const offsetMs = bucharestAtUtcRef.getTime() - utcRef.getTime()
  // To get "dateStr hour:minute in Bucharest" as UTC, subtract the offset
  return new Date(utcRef.getTime() - offsetMs)
}

export async function getAvailableSlots(
  startDate: Date,
  endDate: Date
): Promise<Date[]> {
  const availabilities = await prisma.availability.findMany({
    where: {
      active: true,
      date: { gte: startDate, lte: endDate },
    },
  })

  if (availabilities.length === 0) return []

  const bookedSessions = await prisma.session1on1.findMany({
    where: {
      scheduledAt: { gte: startDate, lte: endDate },
      status: 'BOOKED',
    },
  })

  const bookedTimes = new Set(
    bookedSessions.map((s) => s.scheduledAt.getTime())
  )

  const slots: Date[] = []

  for (const av of availabilities) {
    const [startH, startM] = av.startTime.split(':').map(Number)
    const [endH, endM] = av.endTime.split(':').map(Number)

    let hour = startH
    let minute = startM

    const dateStr = av.date.toISOString().slice(0, 10) // YYYY-MM-DD

    while (hour < endH || (hour === endH && minute < endM)) {
      const slotDate = bucharestToUTC(dateStr, hour, minute)

      if (!bookedTimes.has(slotDate.getTime())) {
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
