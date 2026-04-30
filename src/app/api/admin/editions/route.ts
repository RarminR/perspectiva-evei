import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    courseId,
    editionNumber,
    startDate,
    endDate,
    maxParticipants,
    enrollmentOpen,
    secondInstallmentDueDate,
  } = body

  if (!courseId || !editionNumber || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'courseId, editionNumber, startDate și endDate sunt obligatorii.' },
      { status: 400 }
    )
  }

  const edition = await prisma.courseEdition.create({
    data: {
      courseId,
      editionNumber: Number(editionNumber),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxParticipants: maxParticipants ? Number(maxParticipants) : 15,
      enrollmentOpen: enrollmentOpen ?? false,
      secondInstallmentDueDate: secondInstallmentDueDate
        ? new Date(secondInstallmentDueDate)
        : null,
    },
  })

  return NextResponse.json(edition, { status: 201 })
}
