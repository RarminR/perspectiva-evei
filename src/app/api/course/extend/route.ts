import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { extendAccess } from '@/services/course-expiry'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { enrollmentId } = await request.json()
  if (!enrollmentId) {
    return NextResponse.json({ error: 'enrollmentId required' }, { status: 400 })
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { userId: true },
  })
  const isAdmin = (session.user as any).role === 'ADMIN'
  if (!enrollment || (!isAdmin && enrollment.userId !== (session.user as any).id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  await extendAccess(enrollmentId)
  return NextResponse.json({ success: true })
}
