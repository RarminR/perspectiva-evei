import { prisma } from '@/lib/db'

export interface TimeSlot {
  scheduledAt: Date
  durationMinutes: number
  available: boolean
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

    while (hour < endH || (hour === endH && minute < endM)) {
      const slotDate = new Date(av.date)
      slotDate.setUTCHours(hour, minute, 0, 0)

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
