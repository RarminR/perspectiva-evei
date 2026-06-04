import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/services/email'

const RESET_TTL_HOURS = 1

// POST — cere un link de resetare pe email
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({} as { email?: string }))

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email invalid' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  })

  // Răspundem mereu cu succes ca să nu dezvăluim dacă emailul există
  if (user) {
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    })

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin ||
      'https://perspectivaevei.com'
    const resetUrl = `${origin.replace(/\/$/, '')}/resetare-parola/${token}`

    try {
      await sendPasswordResetEmail(user.email, {
        name: user.name || 'Dragă cititoare',
        resetUrl,
      })
    } catch (err) {
      console.error('Failed to send password reset email:', err)
      return NextResponse.json(
        { error: 'Nu am putut trimite emailul. Încearcă din nou.' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ success: true })
}

// PUT — setează parola nouă folosind tokenul din email
export async function PUT(req: NextRequest) {
  const { token, password } = await req
    .json()
    .catch(() => ({} as { token?: string; password?: string }))

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token invalid' }, { status: 400 })
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Parola trebuie să aibă cel puțin 8 caractere' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({ where: { resetToken: token } })

  if (
    !user ||
    !user.resetTokenExpiresAt ||
    user.resetTokenExpiresAt.getTime() <= Date.now()
  ) {
    return NextResponse.json(
      { error: 'Link de resetare invalid sau expirat' },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
    },
  })

  return NextResponse.json({ success: true })
}
