import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const edition = await prisma.courseEdition.findUnique({
    where: { id },
    select: { id: true, courseId: true },
  })
  if (!edition) {
    return NextResponse.json({ error: 'Ediția nu a fost găsită.' }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.courseEdition.updateMany({
      where: { courseId: edition.courseId, id: { not: id } },
      data: { enrollmentOpen: false },
    }),
    prisma.courseEdition.update({
      where: { id },
      data: { enrollmentOpen: true },
    }),
  ])

  return NextResponse.json({ success: true })
}
