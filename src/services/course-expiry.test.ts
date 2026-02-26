import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    courseEnrollment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/services/email', () => ({
  sendCourseExpiryEmail: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/db'
import { sendCourseExpiryEmail } from '@/services/email'
import { checkExpiredEnrollments, extendAccess } from './course-expiry'

describe('Course Expiry Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkExpiredEnrollments', () => {
    it('finds ACTIVE enrollments where accessExpiresAt < now', async () => {
      vi.mocked(prisma.courseEnrollment.findMany).mockResolvedValue([])

      await checkExpiredEnrollments()

      expect(prisma.courseEnrollment.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          accessExpiresAt: { lt: expect.any(Date) },
        },
        include: {
          user: { select: { email: true, name: true } },
          edition: { include: { course: { select: { title: true } } } },
        },
      })
    })

    it('updates status to EXPIRED for each expired enrollment', async () => {
      const expired = [
        {
          id: 'enroll-1',
          userId: 'user-1',
          editionId: 'ed-1',
          accessExpiresAt: new Date('2026-03-10'),
          user: { email: 'a@b.com', name: 'Ana' },
          edition: { course: { title: 'Cursul A.D.O.' } },
        },
        {
          id: 'enroll-2',
          userId: 'user-2',
          editionId: 'ed-1',
          accessExpiresAt: new Date('2026-03-14'),
          user: { email: 'c@d.com', name: 'Bogdan' },
          edition: { course: { title: 'Cursul A.D.O.' } },
        },
      ]
      vi.mocked(prisma.courseEnrollment.findMany).mockResolvedValue(expired as any)
      vi.mocked(prisma.courseEnrollment.update).mockResolvedValue({} as any)

      await checkExpiredEnrollments()

      expect(prisma.courseEnrollment.update).toHaveBeenCalledTimes(2)
      expect(prisma.courseEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'enroll-1' },
        data: { status: 'EXPIRED' },
      })
      expect(prisma.courseEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'enroll-2' },
        data: { status: 'EXPIRED' },
      })
    })

    it('sends expiry email for each expired enrollment', async () => {
      const expired = [
        {
          id: 'enroll-1',
          user: { email: 'ana@test.com', name: 'Ana' },
          edition: { course: { title: 'Cursul A.D.O.' } },
        },
      ]
      vi.mocked(prisma.courseEnrollment.findMany).mockResolvedValue(expired as any)
      vi.mocked(prisma.courseEnrollment.update).mockResolvedValue({} as any)

      await checkExpiredEnrollments()

      expect(sendCourseExpiryEmail).toHaveBeenCalledWith('ana@test.com', {
        name: 'Ana',
        courseTitle: 'Cursul A.D.O.',
      })
    })

    it('returns count of expired enrollments', async () => {
      const expired = [
        {
          id: 'enroll-1',
          user: { email: 'a@b.com', name: 'Ana' },
          edition: { course: { title: 'Test' } },
        },
        {
          id: 'enroll-2',
          user: { email: 'c@d.com', name: 'B' },
          edition: { course: { title: 'Test' } },
        },
        {
          id: 'enroll-3',
          user: { email: 'e@f.com', name: 'C' },
          edition: { course: { title: 'Test' } },
        },
      ]
      vi.mocked(prisma.courseEnrollment.findMany).mockResolvedValue(expired as any)
      vi.mocked(prisma.courseEnrollment.update).mockResolvedValue({} as any)

      const count = await checkExpiredEnrollments()

      expect(count).toBe(3)
    })

    it('returns 0 when no enrollments are expired', async () => {
      vi.mocked(prisma.courseEnrollment.findMany).mockResolvedValue([])

      const count = await checkExpiredEnrollments()

      expect(count).toBe(0)
      expect(prisma.courseEnrollment.update).not.toHaveBeenCalled()
      expect(sendCourseExpiryEmail).not.toHaveBeenCalled()
    })

    it('continues processing if email fails for one enrollment', async () => {
      const expired = [
        {
          id: 'enroll-1',
          user: { email: 'fail@test.com', name: 'Fail' },
          edition: { course: { title: 'Test' } },
        },
        {
          id: 'enroll-2',
          user: { email: 'ok@test.com', name: 'Ok' },
          edition: { course: { title: 'Test' } },
        },
      ]
      vi.mocked(prisma.courseEnrollment.findMany).mockResolvedValue(expired as any)
      vi.mocked(prisma.courseEnrollment.update).mockResolvedValue({} as any)
      vi.mocked(sendCourseExpiryEmail)
        .mockRejectedValueOnce(new Error('Email failed'))
        .mockResolvedValueOnce(undefined)

      const count = await checkExpiredEnrollments()

      expect(count).toBe(2)
      expect(prisma.courseEnrollment.update).toHaveBeenCalledTimes(2)
    })
  })

  describe('extendAccess', () => {
    it('sets accessExpiresAt to now + 30 days and status to ACTIVE', async () => {
      vi.mocked(prisma.courseEnrollment.findUnique).mockResolvedValue({
        id: 'enroll-1',
        status: 'EXPIRED',
        accessExpiresAt: new Date('2026-03-10'),
      } as any)
      vi.mocked(prisma.courseEnrollment.update).mockResolvedValue({} as any)

      await extendAccess('enroll-1')

      const expectedExpiry = new Date('2026-03-15T12:00:00Z')
      expectedExpiry.setDate(expectedExpiry.getDate() + 30)

      expect(prisma.courseEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'enroll-1' },
        data: {
          status: 'ACTIVE',
          accessExpiresAt: expectedExpiry,
        },
      })
    })

    it('throws error if enrollment not found', async () => {
      vi.mocked(prisma.courseEnrollment.findUnique).mockResolvedValue(null)

      await expect(extendAccess('nonexistent')).rejects.toThrow('Enrollment not found')
    })
  })
})
