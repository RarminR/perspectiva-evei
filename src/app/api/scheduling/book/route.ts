import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookSession } from '@/services/scheduling'
import { sendSessionBookedEmail } from '@/services/email'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if ((session.user as { role?: string }).role !== 'ADMIN') {
      return NextResponse.json(
        {
          error:
            'Rezervarea direct nu mai este disponibilă. Folosește /programare pentru a plăti și a rezerva slotul.',
        },
        { status: 403 }
      )
    }

    const { scheduledAt, durationMinutes = 60 } = await request.json()
    const userId = (session.user as any).id

    const result = await bookSession(userId, new Date(scheduledAt), durationMinutes)

    // Send confirmation email
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) {
      const date = new Date(scheduledAt)
      await sendSessionBookedEmail(user.email, {
        name: user.name,
        sessionDate: date.toLocaleDateString('ro-RO'),
        sessionTime: date.toLocaleTimeString('ro-RO', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    }

    return NextResponse.json({ sessionId: result.id })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to book session'
    const status = message === 'Slot already booked' ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
