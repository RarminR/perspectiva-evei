import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Utilizator negasit' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { name, phone } = await req.json()

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, phone },
  })

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, phone: user.phone })
}
