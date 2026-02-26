import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/lib/db
vi.mock('@/lib/db', () => ({
  prisma: {
    bundle: { findUnique: vi.fn() },
  },
}))

import { prisma } from '@/lib/db'
import { getBundleWithItems, calculateBundleDiscount } from './bundle'

describe('Bundle Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getBundleWithItems', () => {
    it('returns bundle with items and guide details', async () => {
      const mockBundle = {
        id: 'bundle-1',
        title: 'Pachet Complet',
        slug: 'pachet-complet',
        price: 82.5,
        originalPrice: 110,
        active: true,
        items: [
          {
            id: 'bi-1',
            bundleId: 'bundle-1',
            guideId: 'guide-1',
            guide: { id: 'guide-1', title: 'Cine Manifestă?!', price: 99, slug: 'cine-manifesta' },
          },
          {
            id: 'bi-2',
            bundleId: 'bundle-1',
            guideId: 'guide-2',
            guide: { id: 'guide-2', title: 'Ghidul Abundenței', price: 11, slug: 'ghidul-abundentei' },
          },
        ],
      }
      vi.mocked(prisma.bundle.findUnique).mockResolvedValue(mockBundle as any)

      const result = await getBundleWithItems('pachet-complet')

      expect(prisma.bundle.findUnique).toHaveBeenCalledWith({
        where: { slug: 'pachet-complet' },
        include: {
          items: {
            include: {
              guide: { select: { id: true, title: true, price: true, slug: true } },
            },
          },
        },
      })
      expect(result).toEqual(mockBundle)
    })

    it('returns null when bundle not found', async () => {
      vi.mocked(prisma.bundle.findUnique).mockResolvedValue(null)

      const result = await getBundleWithItems('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('calculateBundleDiscount', () => {
    it('calculates savings correctly (individual €110, bundle €82.50 = 25% savings)', async () => {
      vi.mocked(prisma.bundle.findUnique).mockResolvedValue({
        id: 'bundle-1',
        price: 82.5,
        originalPrice: 110,
        items: [
          { guide: { price: 99 } },
          { guide: { price: 11 } },
        ],
      } as any)

      const result = await calculateBundleDiscount('bundle-1')

      expect(result).toEqual({
        bundlePrice: 82.5,
        individualTotal: 110,
        savingsAmount: 27.5,
        savingsPercent: 25,
      })
    })

    it('returns 0% savings when individual total is 0', async () => {
      vi.mocked(prisma.bundle.findUnique).mockResolvedValue({
        id: 'bundle-2',
        price: 0,
        originalPrice: 0,
        items: [
          { guide: { price: 0 } },
        ],
      } as any)

      const result = await calculateBundleDiscount('bundle-2')

      expect(result).toEqual({
        bundlePrice: 0,
        individualTotal: 0,
        savingsAmount: 0,
        savingsPercent: 0,
      })
    })

    it('throws when bundle not found', async () => {
      vi.mocked(prisma.bundle.findUnique).mockResolvedValue(null)

      await expect(calculateBundleDiscount('nonexistent')).rejects.toThrow(
        'Bundle-ul nu a fost găsit.'
      )
    })
  })
})
