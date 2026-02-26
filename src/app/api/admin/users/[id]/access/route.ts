import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const { id } = await params
  const { type, resourceId, expiresAt } = await req.json()

  if (type === 'course') {
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: id,
        editionId: resourceId,
        accessExpiresAt: new Date(expiresAt),
        status: 'ACTIVE',
      },
    })
    return NextResponse.json({ enrollment }, { status: 201 })
  }

  if (type === 'guide') {
    const access = await prisma.guideAccess.create({
      data: {
        userId: id,
        guideId: resourceId,
      },
    })
    return NextResponse.json({ access }, { status: 201 })
  }

  return NextResponse.json({ error: 'Tip invalid. Folosește "course" sau "guide".' }, { status: 400 })
}
