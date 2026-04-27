import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token invalid' }, { status: 400 })
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Parola trebuie să aibă cel puțin 8 caractere' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({ where: { inviteToken: token } })

  if (
    !user ||
    !user.inviteTokenExpiresAt ||
    user.inviteTokenExpiresAt.getTime() <= Date.now()
  ) {
    return NextResponse.json(
      { error: 'Link de invitație invalid sau expirat' },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      hashedPassword,
      inviteToken: null,
      inviteTokenExpiresAt: null,
    },
  })

  return NextResponse.json({ success: true, email: user.email })
}
