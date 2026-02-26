import { prisma } from '@/lib/db'
import { sendCourseExpiryEmail } from '@/services/email'

export async function checkExpiredEnrollments(): Promise<number> {
  const now = new Date()

  const expired = await prisma.courseEnrollment.findMany({
    where: {
      status: 'ACTIVE',
      accessExpiresAt: { lt: now },
    },
    include: {
      user: { select: { email: true, name: true } },
      edition: { include: { course: { select: { title: true } } } },
    },
  })

  for (const enrollment of expired) {
    await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'EXPIRED' },
    })

    try {
      await sendCourseExpiryEmail(enrollment.user.email, {
        name: enrollment.user.name,
        courseTitle: enrollment.edition.course.title,
      })
    } catch (e) {
      console.error('Failed to send expiry email:', e)
    }
  }

  return expired.length
}

export async function extendAccess(enrollmentId: string, days: number = 30): Promise<void> {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
  })

  if (!enrollment) throw new Error('Enrollment not found')

  const newExpiry = new Date()
  newExpiry.setDate(newExpiry.getDate() + days)

  await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: 'ACTIVE',
      accessExpiresAt: newExpiry,
    },
  })
}
