import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const edition = await prisma.courseEdition.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { enrollments: true } },
    },
  })

  if (!edition) {
    return NextResponse.json({ error: 'Ediția nu a fost găsită.' }, { status: 404 })
  }

  return NextResponse.json(edition)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { editionNumber, startDate, endDate, maxParticipants, enrollmentOpen } = body

  const edition = await prisma.courseEdition.update({
    where: { id },
    data: {
      ...(editionNumber !== undefined && { editionNumber: Number(editionNumber) }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(maxParticipants !== undefined && { maxParticipants: Number(maxParticipants) }),
      ...(enrollmentOpen !== undefined && { enrollmentOpen }),
    },
  })

  return NextResponse.json(edition)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await prisma.courseEdition.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
