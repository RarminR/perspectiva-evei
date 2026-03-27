import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedCdnUrl } from '@/services/bunny'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const lessonId = req.nextUrl.searchParams.get('lessonId')
  const key = req.nextUrl.searchParams.get('key')

  if (!lessonId || !key) {
    return NextResponse.json({ error: 'Parametri lipsă' }, { status: 400 })
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      pdfKeys: true,
      edition: {
        select: {
          enrollments: {
            where: { userId },
            select: { id: true, accessExpiresAt: true },
          },
        },
      },
    },
  })

  if (!lesson) {
    return NextResponse.json({ error: 'Lecție inexistentă' }, { status: 404 })
  }

  const enrollment = lesson.edition.enrollments[0]
  if (!enrollment || enrollment.accessExpiresAt < new Date()) {
    return NextResponse.json({ error: 'Nu ai acces' }, { status: 403 })
  }

  if (!lesson.pdfKeys.includes(key)) {
    return NextResponse.json({ error: 'Resursă invalidă' }, { status: 403 })
  }

  const url = getSignedCdnUrl(key, 300)

  return NextResponse.json({ url })
}
