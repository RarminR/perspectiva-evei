import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = await params

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: id } },
    update: { completed: true },
    create: { userId, lessonId: id, completed: true },
  })

  return NextResponse.json({ success: true })
}
