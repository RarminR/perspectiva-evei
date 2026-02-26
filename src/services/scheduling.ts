import { prisma } from '@/lib/db'

export interface TimeSlot {
  scheduledAt: Date
  durationMinutes: number
  available: boolean
}

/**
 * Get available 1-hour slots between startDate and endDate
 * based on Availability records, excluding already-booked sessions.
 */
export async function getAvailableSlots(
  startDate: Date,
  endDate: Date
): Promise<Date[]> {
  const availabilities = await prisma.availability.findMany({
    where: { active: true },
  })

  if (availabilities.length === 0) return []

  // Get all booked sessions in range
  const bookedSessions = await prisma.session1on1.findMany({
    where: {
      scheduledAt: { gte: startDate, lte: endDate },
      status: 'BOOKED',
    },
  })

  const bookedTimes = new Set(
    bookedSessions.map((s) => s.scheduledAt.getTime())
  )

  // Build a map: dayOfWeek -> availability windows
  const availByDay = new Map<number, { startTime: string; endTime: string }[]>()
  for (const av of availabilities) {
    const existing = availByDay.get(av.dayOfWeek) || []
    existing.push({ startTime: av.startTime, endTime: av.endTime })
    availByDay.set(av.dayOfWeek, existing)
  }

  const slots: Date[] = []
  const current = new Date(startDate)
  current.setUTCHours(0, 0, 0, 0)

  const endDay = new Date(endDate)
  endDay.setUTCHours(23, 59, 59, 999)

  while (current <= endDay) {
    const dayOfWeek = current.getUTCDay()
    const windows = availByDay.get(dayOfWeek)

    if (windows) {
      for (const window of windows) {
        const [startH, startM] = window.startTime.split(':').map(Number)
        const [endH, endM] = window.endTime.split(':').map(Number)

        let hour = startH
        let minute = startM

        while (hour < endH || (hour === endH && minute < endM)) {
          const slotDate = new Date(current)
          slotDate.setUTCHours(hour, minute, 0, 0)

          if (
            slotDate >= startDate &&
            slotDate <= endDate &&
            !bookedTimes.has(slotDate.getTime())
          ) {
            slots.push(slotDate)
          }

          // Next hour
          hour += 1
        }
      }
    }

    current.setUTCDate(current.getUTCDate() + 1)
  }

  return slots
}

/**
 * Book a 1:1 session. Checks for conflicts first.
 */
export async function bookSession(
  userId: string,
  scheduledAt: Date,
  durationMinutes: number = 60
): Promise<{ id: string }> {
  // Check for conflicts
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

/**
 * Cancel a session. Must be >24h before session time.
 */
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

/**
 * Get all sessions for a user, ordered by scheduledAt ascending.
 */
export async function getUserSessions(userId: string) {
  return prisma.session1on1.findMany({
    where: { userId },
    orderBy: { scheduledAt: 'asc' },
  })
}
