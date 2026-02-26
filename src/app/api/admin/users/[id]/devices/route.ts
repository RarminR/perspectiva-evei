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

  const devices = await prisma.device.findMany({
    where: { userId: id },
    orderBy: { lastSeen: 'desc' },
  })

  return NextResponse.json({ devices })
}

export async function DELETE(
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
  const { deviceId } = await req.json()

  if (!deviceId) {
    return NextResponse.json({ error: 'ID dispozitiv lipsă' }, { status: 400 })
  }

  await prisma.device.delete({
    where: { id: deviceId, userId: id },
  })

  return NextResponse.json({ success: true })
}
