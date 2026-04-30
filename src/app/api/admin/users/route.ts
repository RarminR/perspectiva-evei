import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const search = req.nextUrl.searchParams.get('search')

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    include: { _count: { select: { devices: true, orders: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string
    name?: string
    role?: string
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const role = body.role === 'ADMIN' ? 'ADMIN' : 'USER'

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalid' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: 'Există deja un utilizator cu acest email.', userId: existing.id },
      { status: 409 }
    )
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: name || email.split('@')[0],
      role,
    },
    select: { id: true, email: true, name: true, role: true },
  })

  return NextResponse.json({ user }, { status: 201 })
}
