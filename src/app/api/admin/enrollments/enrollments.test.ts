import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

const mockEnrollmentFindUnique = vi.fn()
const mockEnrollmentUpdate = vi.fn()
const mockEnrollmentDelete = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    courseEnrollment: {
      findUnique: (...args: any[]) => mockEnrollmentFindUnique(...args),
      update: (...args: any[]) => mockEnrollmentUpdate(...args),
      delete: (...args: any[]) => mockEnrollmentDelete(...args),
    },
  },
}))

const mockExtendAccess = vi.fn()
vi.mock('@/services/course-expiry', () => ({
  extendAccess: (...args: any[]) => mockExtendAccess(...args),
}))

function adminSession() {
  return { user: { id: 'admin-1', role: 'ADMIN' } }
}

describe('Admin Enrollments API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(adminSession())
  })

  describe('PATCH /api/admin/enrollments/[id]', () => {
    it('updates accessExpiresAt and reactivates for a future date', async () => {
      mockEnrollmentFindUnique.mockResolvedValue({ id: 'enr-1', status: 'EXPIRED' })
      mockEnrollmentUpdate.mockResolvedValue({ id: 'enr-1', status: 'ACTIVE' })

      const { PATCH } = await import('@/app/api/admin/enrollments/[id]/route')
      const req = new Request('http://localhost/api/admin/enrollments/enr-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessExpiresAt: '2099-12-31' }),
      })

      const res = await PATCH(req, { params: Promise.resolve({ id: 'enr-1' }) })

      expect(res.status).toBe(200)
      expect(mockEnrollmentUpdate).toHaveBeenCalledWith({
        where: { id: 'enr-1' },
        data: {
          accessExpiresAt: new Date('2099-12-31'),
          status: 'ACTIVE',
        },
      })
    })

    it('marks the enrollment EXPIRED for a past date', async () => {
      mockEnrollmentFindUnique.mockResolvedValue({ id: 'enr-1', status: 'ACTIVE' })
      mockEnrollmentUpdate.mockResolvedValue({ id: 'enr-1', status: 'EXPIRED' })

      const { PATCH } = await import('@/app/api/admin/enrollments/[id]/route')
      const req = new Request('http://localhost/api/admin/enrollments/enr-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessExpiresAt: '2020-01-01' }),
      })

      const res = await PATCH(req, { params: Promise.resolve({ id: 'enr-1' }) })

      expect(res.status).toBe(200)
      expect(mockEnrollmentUpdate).toHaveBeenCalledWith({
        where: { id: 'enr-1' },
        data: {
          accessExpiresAt: new Date('2020-01-01'),
          status: 'EXPIRED',
        },
      })
    })

    it('rejects an invalid date with 400', async () => {
      const { PATCH } = await import('@/app/api/admin/enrollments/[id]/route')
      const req = new Request('http://localhost/api/admin/enrollments/enr-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessExpiresAt: 'nu-e-data' }),
      })

      const res = await PATCH(req, { params: Promise.resolve({ id: 'enr-1' }) })

      expect(res.status).toBe(400)
      expect(mockEnrollmentUpdate).not.toHaveBeenCalled()
    })

    it('returns 404 when the enrollment does not exist', async () => {
      mockEnrollmentFindUnique.mockResolvedValue(null)

      const { PATCH } = await import('@/app/api/admin/enrollments/[id]/route')
      const req = new Request('http://localhost/api/admin/enrollments/missing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessExpiresAt: '2099-12-31' }),
      })

      const res = await PATCH(req, { params: Promise.resolve({ id: 'missing' }) })

      expect(res.status).toBe(404)
    })

    it('returns 401 for non-admin', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'USER' } })

      const { PATCH } = await import('@/app/api/admin/enrollments/[id]/route')
      const req = new Request('http://localhost/api/admin/enrollments/enr-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessExpiresAt: '2099-12-31' }),
      })

      const res = await PATCH(req, { params: Promise.resolve({ id: 'enr-1' }) })

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /api/admin/enrollments/[id]', () => {
    it('removes the enrollment', async () => {
      mockEnrollmentFindUnique.mockResolvedValue({ id: 'enr-1' })
      mockEnrollmentDelete.mockResolvedValue({})

      const { DELETE } = await import('@/app/api/admin/enrollments/[id]/route')
      const req = new Request('http://localhost/api/admin/enrollments/enr-1', { method: 'DELETE' })

      const res = await DELETE(req, { params: Promise.resolve({ id: 'enr-1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockEnrollmentDelete).toHaveBeenCalledWith({ where: { id: 'enr-1' } })
    })

    it('returns 404 when the enrollment does not exist', async () => {
      mockEnrollmentFindUnique.mockResolvedValue(null)

      const { DELETE } = await import('@/app/api/admin/enrollments/[id]/route')
      const req = new Request('http://localhost/api/admin/enrollments/missing', { method: 'DELETE' })

      const res = await DELETE(req, { params: Promise.resolve({ id: 'missing' }) })

      expect(res.status).toBe(404)
      expect(mockEnrollmentDelete).not.toHaveBeenCalled()
    })

    it('returns 401 for non-admin', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'USER' } })

      const { DELETE } = await import('@/app/api/admin/enrollments/[id]/route')
      const req = new Request('http://localhost/api/admin/enrollments/enr-1', { method: 'DELETE' })

      const res = await DELETE(req, { params: Promise.resolve({ id: 'enr-1' }) })

      expect(res.status).toBe(401)
    })
  })
})

describe('POST /api/course/extend ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lets the enrollment owner extend their own access', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'USER' } })
    mockEnrollmentFindUnique.mockResolvedValue({ userId: 'u1' })

    const { POST } = await import('@/app/api/course/extend/route')
    const req = new Request('http://localhost/api/course/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId: 'enr-1' }),
    })

    const res = await POST(req as any)

    expect(res.status).toBe(200)
    expect(mockExtendAccess).toHaveBeenCalledWith('enr-1')
  })

  it("rejects extending someone else's enrollment", async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'USER' } })
    mockEnrollmentFindUnique.mockResolvedValue({ userId: 'u1' })

    const { POST } = await import('@/app/api/course/extend/route')
    const req = new Request('http://localhost/api/course/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId: 'enr-1' }),
    })

    const res = await POST(req as any)

    expect(res.status).toBe(403)
    expect(mockExtendAccess).not.toHaveBeenCalled()
  })

  it('lets an admin extend any enrollment', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mockEnrollmentFindUnique.mockResolvedValue({ userId: 'u1' })

    const { POST } = await import('@/app/api/course/extend/route')
    const req = new Request('http://localhost/api/course/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId: 'enr-1' }),
    })

    const res = await POST(req as any)

    expect(res.status).toBe(200)
    expect(mockExtendAccess).toHaveBeenCalledWith('enr-1')
  })
})
