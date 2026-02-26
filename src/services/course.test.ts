import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @/lib/db
vi.mock('@/lib/db', () => ({
  prisma: {
    course: { findUnique: vi.fn() },
    courseEdition: { findUnique: vi.fn(), findFirst: vi.fn() },
    courseEnrollment: { findFirst: vi.fn(), create: vi.fn() },
    lesson: { findMany: vi.fn(), findUnique: vi.fn() },
    lessonProgress: { findMany: vi.fn(), upsert: vi.fn() },
  },
}))

import { prisma } from '@/lib/db'
import {
  getCourseWithEditions,
  getActiveEdition,
  enrollUser,
  checkAccess,
  getEditionLessons,
  getUserProgress,
  updateProgress,
} from './course'

describe('Course Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getCourseWithEditions', () => {
    it('queries by slug and includes editions with enrollment counts', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Cursul A.D.O.',
        slug: 'cursul-ado',
        editions: [
          { id: 'ed-1', editionNumber: 2, _count: { enrollments: 5 } },
          { id: 'ed-2', editionNumber: 1, _count: { enrollments: 15 } },
        ],
      }
      vi.mocked(prisma.course.findUnique).mockResolvedValue(mockCourse as any)

      const result = await getCourseWithEditions('cursul-ado')

      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { slug: 'cursul-ado' },
        include: {
          editions: {
            orderBy: { startDate: 'desc' },
            include: { _count: { select: { enrollments: true } } },
          },
        },
      })
      expect(result).toEqual(mockCourse)
    })
  })

  describe('getActiveEdition', () => {
    it('finds the most recent open edition that has started', async () => {
      const mockEdition = {
        id: 'ed-1',
        courseId: 'course-1',
        enrollmentOpen: true,
        startDate: new Date('2026-03-01'),
      }
      vi.mocked(prisma.courseEdition.findFirst).mockResolvedValue(mockEdition as any)

      const result = await getActiveEdition('course-1')

      expect(prisma.courseEdition.findFirst).toHaveBeenCalledWith({
        where: {
          courseId: 'course-1',
          enrollmentOpen: true,
          startDate: { lte: expect.any(Date) },
        },
        orderBy: { startDate: 'desc' },
      })
      expect(result).toEqual(mockEdition)
    })
  })

  describe('enrollUser', () => {
    it('enrolls successfully when capacity available', async () => {
      vi.mocked(prisma.courseEdition.findUnique).mockResolvedValue({
        id: 'ed-1',
        endDate: new Date('2026-06-01'),
        enrollmentOpen: true,
        maxParticipants: 15,
        _count: { enrollments: 10 },
      } as any)
      vi.mocked(prisma.courseEnrollment.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.courseEnrollment.create).mockResolvedValue({
        id: 'enroll-1',
        userId: 'user-1',
        editionId: 'ed-1',
        orderId: 'order-1',
        accessExpiresAt: new Date('2026-07-01'),
      } as any)

      const result = await enrollUser('user-1', 'ed-1', 'order-1')

      expect(result).toEqual({ success: true, enrollmentId: 'enroll-1' })
      expect(prisma.courseEnrollment.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          editionId: 'ed-1',
          orderId: 'order-1',
          accessExpiresAt: new Date('2026-07-01'),
        },
      })
    })

    it('returns Romanian error when edition is full (16th enrollment rejected)', async () => {
      vi.mocked(prisma.courseEdition.findUnique).mockResolvedValue({
        id: 'ed-1',
        endDate: new Date('2026-06-01'),
        enrollmentOpen: true,
        maxParticipants: 15,
        _count: { enrollments: 15 },
      } as any)

      const result = await enrollUser('user-16', 'ed-1', 'order-16')

      expect(result).toEqual({
        success: false,
        error: 'Ediția este completă. Nu mai sunt locuri disponibile.',
      })
      expect(prisma.courseEnrollment.create).not.toHaveBeenCalled()
    })

    it('returns existing enrollment if already enrolled', async () => {
      vi.mocked(prisma.courseEdition.findUnique).mockResolvedValue({
        id: 'ed-1',
        endDate: new Date('2026-06-01'),
        enrollmentOpen: true,
        maxParticipants: 15,
        _count: { enrollments: 5 },
      } as any)
      vi.mocked(prisma.courseEnrollment.findFirst).mockResolvedValue({
        id: 'existing-enroll',
        userId: 'user-1',
        editionId: 'ed-1',
      } as any)

      const result = await enrollUser('user-1', 'ed-1', 'order-2')

      expect(result).toEqual({ success: true, enrollmentId: 'existing-enroll' })
      expect(prisma.courseEnrollment.create).not.toHaveBeenCalled()
    })

    it('returns error when enrollment is closed', async () => {
      vi.mocked(prisma.courseEdition.findUnique).mockResolvedValue({
        id: 'ed-1',
        endDate: new Date('2026-06-01'),
        enrollmentOpen: false,
        maxParticipants: 15,
        _count: { enrollments: 5 },
      } as any)

      const result = await enrollUser('user-1', 'ed-1', 'order-1')

      expect(result).toEqual({
        success: false,
        error: 'Înscrierea nu este deschisă.',
      })
    })

    it('returns error when edition not found', async () => {
      vi.mocked(prisma.courseEdition.findUnique).mockResolvedValue(null)

      const result = await enrollUser('user-1', 'nonexistent', 'order-1')

      expect(result).toEqual({
        success: false,
        error: 'Ediția nu a fost găsită.',
      })
    })
  })

  describe('checkAccess', () => {
    it('returns true for valid enrollment with future expiry', async () => {
      vi.mocked(prisma.courseEnrollment.findFirst).mockResolvedValue({
        id: 'enroll-1',
        userId: 'user-1',
        editionId: 'ed-1',
        accessExpiresAt: new Date('2026-07-01'),
      } as any)

      const result = await checkAccess('user-1', 'ed-1')

      expect(result).toBe(true)
    })

    it('returns false when accessExpiresAt is in the past', async () => {
      vi.mocked(prisma.courseEnrollment.findFirst).mockResolvedValue({
        id: 'enroll-1',
        userId: 'user-1',
        editionId: 'ed-1',
        accessExpiresAt: new Date('2026-01-01'), // past
      } as any)

      const result = await checkAccess('user-1', 'ed-1')

      expect(result).toBe(false)
    })

    it('returns false when no enrollment found', async () => {
      vi.mocked(prisma.courseEnrollment.findFirst).mockResolvedValue(null)

      const result = await checkAccess('user-1', 'ed-1')

      expect(result).toBe(false)
    })
  })

  describe('getEditionLessons', () => {
    it('only returns lessons where availableFrom <= now', async () => {
      const mockLessons = [
        { id: 'l-1', title: 'Lesson 1', order: 1, availableFrom: new Date('2026-03-01') },
        { id: 'l-2', title: 'Lesson 2', order: 2, availableFrom: new Date('2026-03-10') },
      ]
      vi.mocked(prisma.lesson.findMany).mockResolvedValue(mockLessons as any)

      const result = await getEditionLessons('ed-1')

      expect(prisma.lesson.findMany).toHaveBeenCalledWith({
        where: {
          editionId: 'ed-1',
          availableFrom: { lte: expect.any(Date) },
        },
        orderBy: { order: 'asc' },
      })
      expect(result).toEqual(mockLessons)
    })
  })

  describe('getUserProgress', () => {
    it('returns lesson progress for user in edition', async () => {
      const mockProgress = [
        {
          id: 'p-1',
          userId: 'user-1',
          lessonId: 'l-1',
          watchedSeconds: 300,
          completed: true,
          lesson: { id: 'l-1', title: 'Lesson 1', order: 1 },
        },
      ]
      vi.mocked(prisma.lessonProgress.findMany).mockResolvedValue(mockProgress as any)

      const result = await getUserProgress('user-1', 'ed-1')

      expect(prisma.lessonProgress.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          lesson: { editionId: 'ed-1' },
        },
        include: { lesson: { select: { id: true, title: true, order: true } } },
        orderBy: { lesson: { order: 'asc' } },
      })
      expect(result).toEqual(mockProgress)
    })
  })

  describe('updateProgress', () => {
    it('marks lesson completed when watchedSeconds >= 90% of duration', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
        id: 'l-1',
        duration: 600, // 10 min
      } as any)

      await updateProgress('user-1', 'l-1', 540) // 90% = 540

      expect(prisma.lessonProgress.upsert).toHaveBeenCalledWith({
        where: { userId_lessonId: { userId: 'user-1', lessonId: 'l-1' } },
        create: { userId: 'user-1', lessonId: 'l-1', watchedSeconds: 540, completed: true },
        update: { watchedSeconds: 540, completed: true },
      })
    })

    it('does not mark completed when watchedSeconds < 90% of duration', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
        id: 'l-1',
        duration: 600,
      } as any)

      await updateProgress('user-1', 'l-1', 300) // 50%

      expect(prisma.lessonProgress.upsert).toHaveBeenCalledWith({
        where: { userId_lessonId: { userId: 'user-1', lessonId: 'l-1' } },
        create: { userId: 'user-1', lessonId: 'l-1', watchedSeconds: 300, completed: false },
        update: { watchedSeconds: 300 },
      })
    })

    it('throws error when lesson not found', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue(null)

      await expect(updateProgress('user-1', 'nonexistent', 100)).rejects.toThrow(
        'Lecția nu a fost găsită.'
      )
    })

    it('sets completed false when lesson has no duration', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
        id: 'l-1',
        duration: null,
      } as any)

      await updateProgress('user-1', 'l-1', 200)

      expect(prisma.lessonProgress.upsert).toHaveBeenCalledWith({
        where: { userId_lessonId: { userId: 'user-1', lessonId: 'l-1' } },
        create: { userId: 'user-1', lessonId: 'l-1', watchedSeconds: 200, completed: false },
        update: { watchedSeconds: 200 },
      })
    })
  })
})
