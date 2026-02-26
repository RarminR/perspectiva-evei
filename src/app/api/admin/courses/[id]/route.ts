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
  const course = await prisma.course.findUnique({
    where: { id },
    include: { editions: { orderBy: { editionNumber: 'asc' } } },
  })

  if (!course) {
    return NextResponse.json({ error: 'Cursul nu a fost găsit.' }, { status: 404 })
  }

  return NextResponse.json(course)
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
  const { title, slug, description, price, installmentPrice, maxParticipants, accessDurationDays } = body

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(installmentPrice !== undefined && { installmentPrice: installmentPrice ? Number(installmentPrice) : null }),
      ...(maxParticipants !== undefined && { maxParticipants: Number(maxParticipants) }),
      ...(accessDurationDays !== undefined && { accessDurationDays: Number(accessDurationDays) }),
    },
  })

  return NextResponse.json(course)
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

  // Check for active enrollments
  const activeEnrollments = await prisma.courseEnrollment.count({
    where: {
      edition: { courseId: id },
      status: 'ACTIVE',
    },
  })

  if (activeEnrollments > 0) {
    return NextResponse.json(
      { error: 'Nu poți șterge un curs cu înscrieri active.' },
      { status: 400 }
    )
  }

  await prisma.course.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
