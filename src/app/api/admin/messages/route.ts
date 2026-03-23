import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversations = await prisma.user.findMany({
    where: { messages: { some: {} } },
    select: {
      id: true,
      name: true,
      email: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, fromAdmin: true, createdAt: true, read: true },
      },
      _count: { select: { messages: { where: { fromAdmin: false, read: false } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const result = conversations.map((u) => ({
    userId: u.id,
    name: u.name,
    email: u.email,
    lastMessage: u.messages[0] ?? null,
    unreadCount: u._count.messages,
  }))

  result.sort((a, b) => b.unreadCount - a.unreadCount)

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, content } = await request.json()

  if (!userId || !content?.trim()) {
    return NextResponse.json({ error: 'userId și content sunt obligatorii' }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: {
      userId,
      fromAdmin: true,
      content: content.trim(),
    },
  })

  return NextResponse.json(message)
}
