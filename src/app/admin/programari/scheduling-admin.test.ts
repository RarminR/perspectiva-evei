import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auth
const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

// Mock prisma
const mockSession1on1FindMany = vi.fn()
const mockSession1on1Update = vi.fn()
const mockAvailabilityFindMany = vi.fn()
const mockAvailabilityCreate = vi.fn()
const mockAvailabilityDelete = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    session1on1: {
      findMany: (...args: any[]) => mockSession1on1FindMany(...args),
      update: (...args: any[]) => mockSession1on1Update(...args),
    },
    availability: {
      findMany: (...args: any[]) => mockAvailabilityFindMany(...args),
      create: (...args: any[]) => mockAvailabilityCreate(...args),
      delete: (...args: any[]) => mockAvailabilityDelete(...args),
    },
  },
}))

function adminSession() {
  return { user: { id: 'u1', role: 'ADMIN' } }
}

describe('Admin Scheduling API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(adminSession())
  })

  describe('GET /api/admin/scheduling', () => {
    it('returns all sessions with user info', async () => {
      const sessions = [
        {
          id: 's1',
          userId: 'u2',
          scheduledAt: new Date('2026-03-01T10:00:00Z'),
          duration: 60,
          status: 'BOOKED',
          zoomLink: null,
          notes: null,
          user: { name: 'Maria', email: 'maria@test.com' },
        },
        {
          id: 's2',
          userId: 'u3',
          scheduledAt: new Date('2026-03-02T14:00:00Z'),
          duration: 60,
          status: 'COMPLETED',
          zoomLink: 'https://zoom.us/j/123',
          notes: 'Discuție bună',
          user: { name: 'Ion', email: 'ion@test.com' },
        },
      ]
      mockSession1on1FindMany.mockResolvedValue(sessions)

      const { GET } = await import('@/app/api/admin/scheduling/route')
      const res = await GET()
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.sessions).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 's1', status: 'BOOKED' }),
        expect.objectContaining({ id: 's2', status: 'COMPLETED' }),
      ]))
      expect(mockSession1on1FindMany).toHaveBeenCalledWith({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { scheduledAt: 'desc' },
      })
    })

    it('returns 403 for non-admin', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'USER' } })

      const { GET } = await import('@/app/api/admin/scheduling/route')
      const res = await GET()

      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /api/admin/scheduling/[id]', () => {
    it('marks session as COMPLETED', async () => {
      const updated = { id: 's1', status: 'COMPLETED', notes: null }
      mockSession1on1Update.mockResolvedValue(updated)

      const { PATCH } = await import('@/app/api/admin/scheduling/[id]/route')
      const req = new Request('http://localhost/api/admin/scheduling/s1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      const res = await PATCH(req as any, { params: Promise.resolve({ id: 's1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.session).toEqual(updated)
      expect(mockSession1on1Update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      })
    })

    it('adds notes to session', async () => {
      const updated = { id: 's1', status: 'BOOKED', notes: 'Note importante' }
      mockSession1on1Update.mockResolvedValue(updated)

      const { PATCH } = await import('@/app/api/admin/scheduling/[id]/route')
      const req = new Request('http://localhost/api/admin/scheduling/s1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Note importante' }),
      })

      const res = await PATCH(req as any, { params: Promise.resolve({ id: 's1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.session.notes).toBe('Note importante')
      expect(mockSession1on1Update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: expect.objectContaining({ notes: 'Note importante' }),
      })
    })

    it('returns 403 for non-admin', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'USER' } })

      const { PATCH } = await import('@/app/api/admin/scheduling/[id]/route')
      const req = new Request('http://localhost/api/admin/scheduling/s1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      const res = await PATCH(req as any, { params: Promise.resolve({ id: 's1' }) })
      expect(res.status).toBe(403)
    })
  })
})

describe('Admin Availability API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(adminSession())
  })

  describe('GET /api/admin/availability', () => {
    it('returns all active availability slots', async () => {
      const slots = [
        { id: 'a1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', active: true },
        { id: 'a2', dayOfWeek: 3, startTime: '14:00', endTime: '17:00', active: true },
      ]
      mockAvailabilityFindMany.mockResolvedValue(slots)

      const { GET } = await import('@/app/api/admin/availability/route')
      const res = await GET()
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.slots).toEqual(slots)
      expect(mockAvailabilityFindMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { dayOfWeek: 'asc' },
      })
    })
  })

  describe('POST /api/admin/availability', () => {
    it('creates new availability slot', async () => {
      const created = { id: 'a3', dayOfWeek: 2, startTime: '10:00', endTime: '13:00', active: true }
      mockAvailabilityCreate.mockResolvedValue(created)

      const { POST } = await import('@/app/api/admin/availability/route')
      const req = new Request('http://localhost/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: 2, startTime: '10:00', endTime: '13:00' }),
      })

      const res = await POST(req as any)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.slot).toEqual(created)
      expect(mockAvailabilityCreate).toHaveBeenCalledWith({
        data: { dayOfWeek: 2, startTime: '10:00', endTime: '13:00' },
      })
    })
  })

  describe('DELETE /api/admin/availability/[id]', () => {
    it('removes availability slot', async () => {
      mockAvailabilityDelete.mockResolvedValue({})

      const { DELETE } = await import('@/app/api/admin/availability/[id]/route')
      const req = new Request('http://localhost/api/admin/availability/a1', { method: 'DELETE' })

      const res = await DELETE(req as any, { params: Promise.resolve({ id: 'a1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockAvailabilityDelete).toHaveBeenCalledWith({ where: { id: 'a1' } })
    })
  })
})
