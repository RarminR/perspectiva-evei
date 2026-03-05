import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id

  const messages = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })

  // Mark unread admin messages as read
  await prisma.message.updateMany({
    where: { userId, fromAdmin: true, read: false },
    data: { read: true },
  })

  return NextResponse.json(messages)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id

  const body = await request.json()
  const content = body.content?.trim()

  if (!content || content.length === 0) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: {
      userId,
      fromAdmin: false,
      content,
    },
  })

  return NextResponse.json(message)
}
