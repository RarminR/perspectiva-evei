import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { editionId, title, order, videoKey, duration, availableFrom } = body

  if (!editionId || !title || order === undefined) {
    return NextResponse.json(
      { error: 'editionId, title și order sunt obligatorii.' },
      { status: 400 }
    )
  }

  const lesson = await prisma.lesson.create({
    data: {
      editionId,
      title,
      order: Number(order),
      videoKey: videoKey || null,
      duration: duration ? Number(duration) : null,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
    },
  })

  return NextResponse.json(lesson, { status: 201 })
}
