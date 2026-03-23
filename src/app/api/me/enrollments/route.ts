import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ enrollments: [] })
  }

  const userId = (session.user as any).id
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId, status: 'ACTIVE' },
    select: {
      edition: {
        select: {
          course: { select: { slug: true } },
        },
      },
    },
  })

  const courseSlugs = enrollments.map((e) => e.edition.course.slug)
  return NextResponse.json({ courseSlugs })
}
