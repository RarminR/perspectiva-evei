import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Toate campurile sunt obligatorii' }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Parola noua trebuie sa aiba cel putin 6 caractere' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.hashedPassword) {
    return NextResponse.json({ error: 'Utilizator negasit' }, { status: 404 })
  }

  const isValid = await bcrypt.compare(currentPassword, user.hashedPassword)
  if (!isValid) {
    return NextResponse.json({ error: 'Parola curenta este incorecta' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: userId },
    data: { hashedPassword },
  })

  return NextResponse.json({ success: true })
}
