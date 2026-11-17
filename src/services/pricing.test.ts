import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    courseEdition: { findFirst: vi.fn() },
    guide: { findUnique: vi.fn() },
    bundle: { findUnique: vi.fn() },
    product: { findUnique: vi.fn() },
    session1on1: { findFirst: vi.fn() },
  },
}))

vi.mock('@/lib/constants/pricing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants/pricing')>()
  return { ...actual, COURSE_PROMO: { ...actual.COURSE_PROMO, enabled: true, applyInCode: true } }
})

import { prisma } from '@/lib/db'
import { PricingError, resolveCheckoutItem } from './pricing'

const OPEN_EDITION = {
  id: 'edition-15',
  editionNumber: 15,
  course: { title: 'Cursul A.D.O.!', price: 1188, installmentPrice: 644 },
}

const DURING_BF = new Date('2026-11-20T10:00:00Z')
const AFTER_BF = new Date('2026-11-23T10:00:00Z')

describe('resolveCheckoutItem (discount applied in code)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.courseEdition.findFirst).mockResolvedValue(OPEN_EDITION as any)
  })

  it('prices the course from the database, with −20% on full payment during Black Friday', async () => {
    const item = await resolveCheckoutItem('COURSE', null, 'full', DURING_BF)
    expect(item).toMatchObject({ productId: 'edition-15', priceEur: 950.4, priceEurCents: 95040 })
  })

  it('charges the regular price outside the window', async () => {
    const item = await resolveCheckoutItem('COURSE', 'edition-15', 'full', AFTER_BF)
    expect(item.priceEurCents).toBe(118800)
  })

  it('never discounts the instalment', async () => {
    const item = await resolveCheckoutItem('COURSE', 'edition-15', 'installment', DURING_BF)
    expect(item.priceEurCents).toBe(64400)
  })

  it('refuses an edition that is no longer open', async () => {
    await expect(resolveCheckoutItem('COURSE', 'edition-14', 'full', AFTER_BF)).rejects.toMatchObject({
      status: 409,
    })
  })

  it('prices a guide from the database', async () => {
    vi.mocked(prisma.guide.findUnique).mockResolvedValue({ id: 'g1', title: 'Ghid', price: 27.5 } as any)
    const item = await resolveCheckoutItem('GUIDE', 'g1')
    expect(item).toMatchObject({ productId: 'g1', priceEurCents: 2750 })
  })

  it('rejects unknown products and types', async () => {
    vi.mocked(prisma.guide.findUnique).mockResolvedValue(null)
    await expect(resolveCheckoutItem('GUIDE', 'nope')).rejects.toBeInstanceOf(PricingError)
    await expect(resolveCheckoutItem('GIFT', 'x')).rejects.toMatchObject({ status: 400 })
  })

  it('refuses inactive physical products', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'p1', title: 'Sacoșă', price: 8, active: false } as any)
    await expect(resolveCheckoutItem('PRODUCT', 'p1')).rejects.toMatchObject({ status: 404 })
  })
})
