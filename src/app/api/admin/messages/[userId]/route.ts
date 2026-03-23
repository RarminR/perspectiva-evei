import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params

  const messages = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })

  await prisma.message.updateMany({
    where: { userId, fromAdmin: false, read: false },
    data: { read: true },
  })

  return NextResponse.json(messages)
}
