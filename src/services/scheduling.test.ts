import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    availability: { findMany: vi.fn() },
    session1on1: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import {
  getAvailableSlots,
  bookSession,
  cancelSession,
  getUserSessions,
} from './scheduling'

describe('Scheduling Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-02T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getAvailableSlots', () => {
    it('returns time slots based on Availability records', async () => {
      vi.mocked(prisma.availability.findMany).mockResolvedValue([
        {
          id: 'av1',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
          active: true,
          createdAt: new Date(),
        },
      ])
      vi.mocked(prisma.session1on1.findMany).mockResolvedValue([])

      const start = new Date('2026-03-02T00:00:00Z')
      const end = new Date('2026-03-02T23:59:59Z')
      const slots = await getAvailableSlots(start, end)

      expect(slots.length).toBe(3)
      expect(slots[0]).toEqual(new Date('2026-03-02T09:00:00Z'))
      expect(slots[1]).toEqual(new Date('2026-03-02T10:00:00Z'))
      expect(slots[2]).toEqual(new Date('2026-03-02T11:00:00Z'))
    })

    it('excludes already-booked slots', async () => {
      vi.mocked(prisma.availability.findMany).mockResolvedValue([
        {
          id: 'av1',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
          active: true,
          createdAt: new Date(),
        },
      ])
      vi.mocked(prisma.session1on1.findMany).mockResolvedValue([
        {
          id: 's1',
          userId: 'u1',
          scheduledAt: new Date('2026-03-02T10:00:00Z'),
          duration: 60,
          status: 'BOOKED',
          zoomLink: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any)

      const start = new Date('2026-03-02T00:00:00Z')
      const end = new Date('2026-03-02T23:59:59Z')
      const slots = await getAvailableSlots(start, end)

      expect(slots.length).toBe(2)
      expect(slots[0]).toEqual(new Date('2026-03-02T09:00:00Z'))
      expect(slots[1]).toEqual(new Date('2026-03-02T11:00:00Z'))
    })

    it('returns empty array when no availability configured', async () => {
      vi.mocked(prisma.availability.findMany).mockResolvedValue([])
      vi.mocked(prisma.session1on1.findMany).mockResolvedValue([])

      const start = new Date('2026-03-02T00:00:00Z')
      const end = new Date('2026-03-02T23:59:59Z')
      const slots = await getAvailableSlots(start, end)

      expect(slots).toEqual([])
    })

    it('generates slots across multiple days matching availability', async () => {
      vi.mocked(prisma.availability.findMany).mockResolvedValue([
        {
          id: 'av1',
          dayOfWeek: 1,
          startTime: '14:00',
          endTime: '16:00',
          active: true,
          createdAt: new Date(),
        },
        {
          id: 'av2',
          dayOfWeek: 3,
          startTime: '10:00',
          endTime: '12:00',
          active: true,
          createdAt: new Date(),
        },
      ])
      vi.mocked(prisma.session1on1.findMany).mockResolvedValue([])

      const start = new Date('2026-03-02T00:00:00Z')
      const end = new Date('2026-03-05T23:59:59Z')
      const slots = await getAvailableSlots(start, end)

      expect(slots.length).toBe(4)
      expect(slots[0]).toEqual(new Date('2026-03-02T14:00:00Z'))
      expect(slots[1]).toEqual(new Date('2026-03-02T15:00:00Z'))
      expect(slots[2]).toEqual(new Date('2026-03-04T10:00:00Z'))
      expect(slots[3]).toEqual(new Date('2026-03-04T11:00:00Z'))
    })
  })

  describe('bookSession', () => {
    it('creates a Session1on1 record with correct fields', async () => {
      vi.mocked(prisma.session1on1.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.session1on1.create).mockResolvedValue({
        id: 'sess-123',
        userId: 'user-1',
        scheduledAt: new Date('2026-03-05T10:00:00Z'),
        duration: 60,
        status: 'BOOKED',
        zoomLink: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await bookSession(
        'user-1',
        new Date('2026-03-05T10:00:00Z'),
        60
      )

      expect(result).toEqual({ id: 'sess-123' })
      expect(prisma.session1on1.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          scheduledAt: new Date('2026-03-05T10:00:00Z'),
          duration: 60,
          status: 'BOOKED',
        },
      })
    })

    it('throws if slot already booked (conflict check)', async () => {
      vi.mocked(prisma.session1on1.findFirst).mockResolvedValue({
        id: 'existing',
        userId: 'other-user',
        scheduledAt: new Date('2026-03-05T10:00:00Z'),
        duration: 60,
        status: 'BOOKED',
        zoomLink: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      await expect(
        bookSession('user-1', new Date('2026-03-05T10:00:00Z'), 60)
      ).rejects.toThrow('Slot already booked')
    })

    it('uses default 60 minute duration', async () => {
      vi.mocked(prisma.session1on1.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.session1on1.create).mockResolvedValue({
        id: 'sess-456',
        userId: 'user-1',
        scheduledAt: new Date('2026-03-05T10:00:00Z'),
        duration: 60,
        status: 'BOOKED',
        zoomLink: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      await bookSession('user-1', new Date('2026-03-05T10:00:00Z'))

      expect(prisma.session1on1.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ duration: 60 }),
      })
    })
  })

  describe('cancelSession', () => {
    it('updates status to CANCELLED when >24h before session', async () => {
      vi.mocked(prisma.session1on1.findFirst).mockResolvedValue({
        id: 'sess-1',
        userId: 'user-1',
        scheduledAt: new Date('2026-03-05T10:00:00Z'),
        duration: 60,
        status: 'BOOKED',
        zoomLink: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      vi.mocked(prisma.session1on1.update).mockResolvedValue({} as any)

      await cancelSession('sess-1', 'user-1')

      expect(prisma.session1on1.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: { status: 'CANCELLED' },
      })
    })

    it('throws error when session is within 24h', async () => {
      vi.mocked(prisma.session1on1.findFirst).mockResolvedValue({
        id: 'sess-1',
        userId: 'user-1',
        scheduledAt: new Date('2026-03-02T20:00:00Z'),
        duration: 60,
        status: 'BOOKED',
        zoomLink: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      await expect(cancelSession('sess-1', 'user-1')).rejects.toThrow(
        'Cannot cancel within 24 hours'
      )
    })

    it('throws if session does not belong to user', async () => {
      vi.mocked(prisma.session1on1.findFirst).mockResolvedValue(null)

      await expect(cancelSession('sess-1', 'wrong-user')).rejects.toThrow(
        'Session not found'
      )
    })
  })

  describe('getUserSessions', () => {
    it('returns sessions ordered by scheduledAt asc', async () => {
      const sessions = [
        {
          id: 's1',
          userId: 'user-1',
          scheduledAt: new Date('2026-03-05T10:00:00Z'),
          duration: 60,
          status: 'BOOKED',
          zoomLink: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 's2',
          userId: 'user-1',
          scheduledAt: new Date('2026-03-10T14:00:00Z'),
          duration: 60,
          status: 'BOOKED',
          zoomLink: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      vi.mocked(prisma.session1on1.findMany).mockResolvedValue(sessions as any)

      const result = await getUserSessions('user-1')

      expect(result).toEqual(sessions)
      expect(prisma.session1on1.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { scheduledAt: 'asc' },
      })
    })

    it('returns empty array for user with no sessions', async () => {
      vi.mocked(prisma.session1on1.findMany).mockResolvedValue([])

      const result = await getUserSessions('user-no-sessions')

      expect(result).toEqual([])
    })
  })
})
