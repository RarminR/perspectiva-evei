import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendInviteEmail } from '@/services/email'

const INVITE_TTL_DAYS = 30

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({} as { sendEmail?: boolean }))
  const sendEmail = body?.sendEmail !== false

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 })
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id },
    data: { inviteToken: token, inviteTokenExpiresAt: expiresAt },
  })

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin ||
    'https://perspectivaevei.com'
  const inviteUrl = `${origin.replace(/\/$/, '')}/invitatie/${token}`

  let emailSent = false
  let emailError: string | undefined
  if (sendEmail && user.email) {
    try {
      await sendInviteEmail(user.email, {
        name: user.name || 'Dragă cititoare',
        inviteUrl,
      })
      emailSent = true
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Eroare la trimitere email'
      console.error('Failed to send invite email:', err)
    }
  }

  return NextResponse.json({ inviteUrl, expiresAt, emailSent, emailError })
}
