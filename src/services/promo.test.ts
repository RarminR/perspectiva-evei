import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @/lib/db
vi.mock('@/lib/db', () => ({
  prisma: {
    promoCode: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

import { prisma } from '@/lib/db'
import { validatePromoCode, applyPromoCode, incrementPromoUse } from './promo'

describe('Promo Code Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('validatePromoCode', () => {
    it('returns valid result with correct discount for a valid PERCENTAGE code', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-1',
        code: 'SAVE20',
        type: 'PERCENTAGE',
        value: 20,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
        maxUses: 100,
        currentUses: 5,
        active: true,
        createdAt: new Date(),
      } as any)

      const result = await validatePromoCode('SAVE20', 99.0)

      expect(result).toEqual({
        valid: true,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        finalAmount: 79.2,
      })
    })

    it('returns valid result with correct discount for a valid FIXED code', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-2',
        code: 'MINUS10',
        type: 'FIXED',
        value: 10,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        currentUses: 0,
        active: true,
        createdAt: new Date(),
      } as any)

      const result = await validatePromoCode('MINUS10', 99.0)

      expect(result).toEqual({
        valid: true,
        discountType: 'FIXED',
        discountValue: 10,
        finalAmount: 89.0,
      })
    })

    it('returns error when code does not exist', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue(null)

      const result = await validatePromoCode('NONEXISTENT', 99.0)

      expect(result).toEqual({
        valid: false,
        error: 'Codul promoțional nu există.',
      })
    })

    it('returns error when code is not yet active (validFrom in future)', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-3',
        code: 'FUTURE',
        type: 'PERCENTAGE',
        value: 10,
        validFrom: new Date('2026-06-01'),
        validUntil: new Date('2026-12-31'),
        maxUses: null,
        currentUses: 0,
        active: true,
        createdAt: new Date(),
      } as any)

      const result = await validatePromoCode('FUTURE', 99.0)

      expect(result).toEqual({
        valid: false,
        error: 'Codul promoțional nu este încă activ.',
      })
    })

    it('returns error when code has expired (validUntil in past)', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-4',
        code: 'EXPIRED',
        type: 'PERCENTAGE',
        value: 15,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        maxUses: null,
        currentUses: 0,
        active: true,
        createdAt: new Date(),
      } as any)

      const result = await validatePromoCode('EXPIRED', 99.0)

      expect(result).toEqual({
        valid: false,
        error: 'Codul promoțional a expirat.',
      })
    })

    it('returns error when max uses reached', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-5',
        code: 'MAXED',
        type: 'FIXED',
        value: 5,
        validFrom: null,
        validUntil: null,
        maxUses: 10,
        currentUses: 10,
        active: true,
        createdAt: new Date(),
      } as any)

      const result = await validatePromoCode('MAXED', 99.0)

      expect(result).toEqual({
        valid: false,
        error: 'Codul a fost folosit de numărul maxim de ori.',
      })
    })

    it('returns error when code is inactive', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-6',
        code: 'INACTIVE',
        type: 'PERCENTAGE',
        value: 10,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        currentUses: 0,
        active: false,
        createdAt: new Date(),
      } as any)

      const result = await validatePromoCode('INACTIVE', 99.0)

      expect(result).toEqual({
        valid: false,
        error: 'Codul promoțional nu este activ.',
      })
    })
  })

  describe('applyPromoCode', () => {
    it('applies PERCENTAGE discount: 20% off €99 = €79.20', () => {
      const result = applyPromoCode(99.0, 'PERCENTAGE', 20)

      expect(result).toBe(79.2)
    })

    it('applies FIXED discount: €10 off €99 = €89', () => {
      const result = applyPromoCode(99.0, 'FIXED', 10)

      expect(result).toBe(89.0)
    })

    it('FIXED discount larger than amount returns 0', () => {
      const result = applyPromoCode(5.0, 'FIXED', 20)

      expect(result).toBe(0)
    })

    it('PERCENTAGE 100% returns 0', () => {
      const result = applyPromoCode(99.0, 'PERCENTAGE', 100)

      expect(result).toBe(0)
    })
  })

  describe('incrementPromoUse', () => {
    it('calls prisma.promoCode.update with increment on currentUses', async () => {
      vi.mocked(prisma.promoCode.update).mockResolvedValue({} as any)

      await incrementPromoUse('SAVE20')

      expect(prisma.promoCode.update).toHaveBeenCalledWith({
        where: { code: 'SAVE20' },
        data: { currentUses: { increment: 1 } },
      })
    })
  })
})
