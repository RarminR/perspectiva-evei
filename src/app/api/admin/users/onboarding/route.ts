import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendInviteEmail } from '@/services/email'
import pLimit from 'p-limit'

const INVITE_TTL_DAYS = 30

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

  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

  // Resend rate limit: max 2 req/s on free, ~10 on paid — keep to 5 concurrent to stay safe
  const limit = pLimit(5)

  const results = await Promise.allSettled(
    users.map((user) =>
      limit(async () => {
        const token = randomBytes(32).toString('hex')
        await prisma.user.update({
          where: { id: user.id },
          data: { inviteToken: token, inviteTokenExpiresAt: expiresAt },
        })
        const inviteUrl = `${origin.replace(/\/$/, '')}/invitatie/${token}`
        await sendInviteEmail(user.email, {
          name: user.name || 'Dragă cititoare',
          inviteUrl,
        })
      })
    )
  )

  const sentIds = users.filter((_, i) => results[i].status === 'fulfilled').map((u) => u.id)
  const failed = users.filter((_, i) => results[i].status === 'rejected').map((u) => u.email)

  if (sentIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: sentIds } },
      data: { onboardingEmailSentAt: new Date() },
    })
  }

  return NextResponse.json({ sent: sentIds.length, failed })
}
