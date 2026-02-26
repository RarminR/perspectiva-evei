import { prisma } from '@/lib/db'

export async function getCourseWithEditions(courseSlug: string) {
  return prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      editions: {
        orderBy: { startDate: 'desc' },
        include: { _count: { select: { enrollments: true } } },
      },
    },
  })
}

export async function getActiveEdition(courseId: string) {
  const now = new Date()
  return prisma.courseEdition.findFirst({
    where: {
      courseId,
      enrollmentOpen: true,
      startDate: { lte: now },
    },
    orderBy: { startDate: 'desc' },
  })
}

export async function enrollUser(
  userId: string,
  editionId: string,
  orderId: string
): Promise<{ success: boolean; error?: string; enrollmentId?: string }> {
  // Check edition exists and get maxParticipants
  const edition = await prisma.courseEdition.findUnique({
    where: { id: editionId },
    include: { _count: { select: { enrollments: true } } },
  })
  if (!edition) return { success: false, error: 'Ediția nu a fost găsită.' }
  if (!edition.enrollmentOpen)
    return { success: false, error: 'Înscrierea nu este deschisă.' }

  // Check capacity
  if (edition._count.enrollments >= edition.maxParticipants) {
    return {
      success: false,
      error: 'Ediția este completă. Nu mai sunt locuri disponibile.',
    }
  }

  // Check if already enrolled
  const existing = await prisma.courseEnrollment.findFirst({
    where: { userId, editionId },
  })
  if (existing) return { success: true, enrollmentId: existing.id }

  // Calculate access expiry: 30 days after edition endDate
  const accessExpiresAt = new Date(edition.endDate)
  accessExpiresAt.setDate(accessExpiresAt.getDate() + 30)

  const enrollment = await prisma.courseEnrollment.create({
    data: { userId, editionId, orderId, accessExpiresAt },
  })
  return { success: true, enrollmentId: enrollment.id }
}

export async function checkAccess(
  userId: string,
  editionId: string
): Promise<boolean> {
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: { userId, editionId },
  })
  if (!enrollment) return false
  if (enrollment.accessExpiresAt && enrollment.accessExpiresAt < new Date())
    return false
  return true
}

export async function getEditionLessons(editionId: string) {
  const now = new Date()
  return prisma.lesson.findMany({
    where: {
      editionId,
      availableFrom: { lte: now },
    },
    orderBy: { order: 'asc' },
  })
}

export async function getUserProgress(userId: string, editionId: string) {
  return prisma.lessonProgress.findMany({
    where: {
      userId,
      lesson: { editionId },
    },
    include: { lesson: { select: { id: true, title: true, order: true } } },
    orderBy: { lesson: { order: 'asc' } },
  })
}

export async function updateProgress(
  userId: string,
  lessonId: string,
  watchedSeconds: number
): Promise<void> {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson) throw new Error('Lecția nu a fost găsită.')

  const completed = lesson.duration
    ? watchedSeconds >= lesson.duration * 0.9
    : false

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, watchedSeconds, completed },
    update: {
      watchedSeconds,
      ...(completed ? { completed: true } : {}),
    },
  })
}
