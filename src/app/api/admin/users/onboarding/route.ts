import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendWelcomeEmail } from '@/services/email'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })

  const { userIds } = (await req.json()) as { userIds?: string[] }
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'userIds lipsă' }, { status: 400 })
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })

  const results = await Promise.allSettled(
    users.map((user) => sendWelcomeEmail(user.email, user.name))
  )

  const sentIds = users
    .filter((_, i) => results[i].status === 'fulfilled')
    .map((u) => u.id)

  if (sentIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: sentIds } },
      data: { onboardingEmailSentAt: new Date() },
    })
  }

  const failed = users.filter((_, i) => results[i].status === 'rejected').map((u) => u.email)

  return NextResponse.json({ sent: sentIds.length, failed })
}
