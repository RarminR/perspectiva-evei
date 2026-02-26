import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
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

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      devices: true,
      orders: { orderBy: { createdAt: 'desc' }, take: 20 },
      enrollments: { include: { edition: { include: { course: true } } } },
      guideAccess: { include: { guide: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 })
  }

  return NextResponse.json({ user })
}

export async function PUT(
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
  const { role } = await req.json()

  if (!role || !['ADMIN', 'USER'].includes(role)) {
    return NextResponse.json({ error: 'Rol invalid' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
  })

  return NextResponse.json({ user })
}

export async function DELETE(
  _req: NextRequest,
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

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
