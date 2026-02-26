import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auth
const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

// Mock prisma
const mockPromoCodeFindMany = vi.fn()
const mockPromoCodeCreate = vi.fn()
const mockPromoCodeUpdate = vi.fn()
const mockPromoCodeDelete = vi.fn()
const mockBundleFindMany = vi.fn()
const mockBundleCreate = vi.fn()
const mockBundleUpdate = vi.fn()
const mockBundleDelete = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    promoCode: {
      findMany: (...args: any[]) => mockPromoCodeFindMany(...args),
      create: (...args: any[]) => mockPromoCodeCreate(...args),
      update: (...args: any[]) => mockPromoCodeUpdate(...args),
      delete: (...args: any[]) => mockPromoCodeDelete(...args),
    },
    bundle: {
      findMany: (...args: any[]) => mockBundleFindMany(...args),
      create: (...args: any[]) => mockBundleCreate(...args),
      update: (...args: any[]) => mockBundleUpdate(...args),
      delete: (...args: any[]) => mockBundleDelete(...args),
    },
  },
}))

function adminSession() {
  return { user: { id: 'u1', role: 'ADMIN' } }
}

describe('Admin Promo API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(adminSession())
  })

  describe('GET /api/admin/promo', () => {
    it('returns list of promo codes', async () => {
      const codes = [
        { id: 'p1', code: 'SAVE20', type: 'PERCENTAGE', value: 20, active: true, currentUses: 3, maxUses: 100 },
        { id: 'p2', code: 'FLAT10', type: 'FIXED', value: 10, active: false, currentUses: 0, maxUses: null },
      ]
      mockPromoCodeFindMany.mockResolvedValue(codes)

      const { GET } = await import('@/app/api/admin/promo/route')
      const res = await GET()
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.codes).toEqual(codes)
      expect(mockPromoCodeFindMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } })
    })

    it('returns 401 for non-admin', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'USER' } })

      const { GET } = await import('@/app/api/admin/promo/route')
      const res = await GET()

      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/admin/promo', () => {
    it('creates a new promo code', async () => {
      const created = { id: 'p3', code: 'NEW50', type: 'PERCENTAGE', value: 50, active: true }
      mockPromoCodeCreate.mockResolvedValue(created)

      const { POST } = await import('@/app/api/admin/promo/route')
      const req = new Request('http://localhost/api/admin/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'NEW50', type: 'PERCENTAGE', value: 50 }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.code).toEqual(created)
      expect(mockPromoCodeCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ code: 'NEW50', type: 'PERCENTAGE', value: 50 }),
      })
    })
  })

  describe('PATCH /api/admin/promo/[id]', () => {
    it('updates promo code active status', async () => {
      const updated = { id: 'p1', code: 'SAVE20', active: false }
      mockPromoCodeUpdate.mockResolvedValue(updated)

      const { PATCH } = await import('@/app/api/admin/promo/[id]/route')
      const req = new Request('http://localhost/api/admin/promo/p1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })

      const res = await PATCH(req, { params: Promise.resolve({ id: 'p1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.code).toEqual(updated)
      expect(mockPromoCodeUpdate).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { active: false } })
    })
  })

  describe('DELETE /api/admin/promo/[id]', () => {
    it('deletes promo code', async () => {
      mockPromoCodeDelete.mockResolvedValue({})

      const { DELETE } = await import('@/app/api/admin/promo/[id]/route')
      const req = new Request('http://localhost/api/admin/promo/p1', { method: 'DELETE' })

      const res = await DELETE(req, { params: Promise.resolve({ id: 'p1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPromoCodeDelete).toHaveBeenCalledWith({ where: { id: 'p1' } })
    })
  })
})

describe('Admin Bundles API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(adminSession())
  })

  describe('GET /api/admin/bundles', () => {
    it('returns list of bundles with items', async () => {
      const bundles = [
        { id: 'b1', title: 'Pachet Complet', slug: 'pachet-complet', price: 82.5, originalPrice: 110, active: true, items: [{ id: 'bi1' }] },
      ]
      mockBundleFindMany.mockResolvedValue(bundles)

      const { GET } = await import('@/app/api/admin/bundles/route')
      const res = await GET()
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.bundles).toEqual(bundles)
      expect(mockBundleFindMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      })
    })
  })

  describe('POST /api/admin/bundles', () => {
    it('creates a new bundle with slug', async () => {
      const created = { id: 'b2', title: 'Nou Pachet', slug: 'nou-pachet', price: 50, originalPrice: 70, active: true }
      mockBundleCreate.mockResolvedValue(created)

      const { POST } = await import('@/app/api/admin/bundles/route')
      const req = new Request('http://localhost/api/admin/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nou Pachet', slug: 'nou-pachet', price: 50, originalPrice: 70 }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.bundle).toEqual(created)
      expect(mockBundleCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ title: 'Nou Pachet', slug: 'nou-pachet', price: 50, originalPrice: 70 }),
      })
    })
  })

  describe('PATCH /api/admin/bundles/[id]', () => {
    it('updates bundle', async () => {
      const updated = { id: 'b1', title: 'Pachet Actualizat', price: 90, originalPrice: 110, active: true }
      mockBundleUpdate.mockResolvedValue(updated)

      const { PATCH } = await import('@/app/api/admin/bundles/[id]/route')
      const req = new Request('http://localhost/api/admin/bundles/b1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Pachet Actualizat', price: 90 }),
      })

      const res = await PATCH(req, { params: Promise.resolve({ id: 'b1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.bundle).toEqual(updated)
      expect(mockBundleUpdate).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { title: 'Pachet Actualizat', price: 90 },
      })
    })
  })

  describe('DELETE /api/admin/bundles/[id]', () => {
    it('deletes bundle', async () => {
      mockBundleDelete.mockResolvedValue({})

      const { DELETE } = await import('@/app/api/admin/bundles/[id]/route')
      const req = new Request('http://localhost/api/admin/bundles/b1', { method: 'DELETE' })

      const res = await DELETE(req, { params: Promise.resolve({ id: 'b1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockBundleDelete).toHaveBeenCalledWith({ where: { id: 'b1' } })
    })
  })
})
