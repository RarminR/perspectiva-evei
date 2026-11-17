import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    guideAccess: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    bundle: {
      findUnique: vi.fn(),
    },
    invoice: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/services/revolut', () => ({
  createOrder: vi.fn(),
  getOrder: vi.fn(),
}))

vi.mock('@/services/smartbill', () => ({
  createInvoice: vi.fn(),
}))

vi.mock('@/services/pricing', () => ({
  resolveCheckoutItem: vi.fn(),
}))

import { prisma } from '@/lib/db'
import { createOrder, getOrder } from '@/services/revolut'
import { resolveCheckoutItem } from '@/services/pricing'
import { createCheckout, getOrderStatus, handleOrderComplete } from './checkout'

// Prices as the database knows them; the browser's priceEurCents is ignored.
const SERVER_PRICES: Record<string, number> = {
  'guide-1': 118800,
  'guide-2': 2500,
  'guide-3': 1000,
}

describe('Checkout Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveCheckoutItem).mockImplementation(async (productType, productId) => {
      const cents = SERVER_PRICES[productId ?? '']
      if (cents === undefined) throw new Error('Ghidul nu a fost găsit')
      return {
        productId: productId as string,
        productType: productType as 'GUIDE',
        name: `Server: ${productId}`,
        priceEur: cents / 100,
        priceEurCents: cents,
      }
    })
  })

  describe('createCheckout: server-side prices', () => {
    const revolutOrder = {
      id: 'rev-order-x',
      token: 'checkout-token-x',
      state: 'PENDING',
      type: 'payment',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      amount: 0,
      currency: 'EUR',
    }

    it('charges the database price, not the price sent by the browser', async () => {
      vi.mocked(createOrder).mockResolvedValue(revolutOrder as any)
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'ord-x' } as any)

      await createCheckout('user-1', [
        { productId: 'guide-1', productType: 'GUIDE', name: 'Fake', priceEurCents: 1, quantity: 1 },
      ])

      expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: 118800 }))
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 1188,
            items: {
              create: [expect.objectContaining({ productId: 'guide-1', unitPrice: 1188, quantity: 1 })],
            },
          }),
        })
      )
    })

    it('ignores a quantity above 1 for digital items', async () => {
      vi.mocked(createOrder).mockResolvedValue(revolutOrder as any)
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'ord-y' } as any)

      await createCheckout('user-1', [
        { productId: 'guide-2', productType: 'GUIDE', name: 'Ghid', priceEurCents: 2500, quantity: 3 },
      ])

      expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: 2500 }))
    })

    it('creates no order when an item cannot be priced', async () => {
      await expect(
        createCheckout('user-1', [
          { productId: 'missing', productType: 'GUIDE', name: 'Ghid', priceEurCents: 100, quantity: 1 },
        ])
      ).rejects.toThrow('Ghidul nu a fost găsit')

      expect(createOrder).not.toHaveBeenCalled()
      expect(prisma.order.create).not.toHaveBeenCalled()
    })
  })

  describe('createCheckout', () => {
    it('calls createOrder with total amount and expirePendingAfter PT24H', async () => {
      vi.mocked(createOrder).mockResolvedValue({
        id: 'rev-order-1',
        token: 'checkout-token-1',
        state: 'PENDING',
        type: 'payment',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        amount: 118800,
        currency: 'EUR',
      })
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'ord-1' } as any)

      await createCheckout('user-1', [
        {
          productId: 'guide-1',
          productType: 'GUIDE',
          name: 'Ghid A.D.O.!',
          priceEurCents: 118800,
          quantity: 1,
        },
      ])

      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 118800,
          currency: 'EUR',
          expirePendingAfter: 'PT24H',
        })
      )
    })

    it('saves order to db with status PENDING', async () => {
      vi.mocked(createOrder).mockResolvedValue({
        id: 'rev-order-2',
        token: 'checkout-token-2',
        state: 'PENDING',
        type: 'payment',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        amount: 2500,
        currency: 'EUR',
      })
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'ord-2' } as any)

      await createCheckout('user-2', [
        {
          productId: 'guide-2',
          productType: 'GUIDE',
          name: 'Ghid test',
          priceEurCents: 2500,
          quantity: 1,
        },
      ])

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-2',
            revolutOrderId: 'rev-order-2',
            status: 'PENDING',
          }),
        })
      )
    })

    it('returns revolutOrderId and checkoutToken', async () => {
      vi.mocked(createOrder).mockResolvedValue({
        id: 'rev-order-3',
        token: 'checkout-token-3',
        checkout_url: 'https://checkout.revolut.com/pay/abc',
        state: 'PENDING',
        type: 'payment',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        amount: 1000,
        currency: 'EUR',
      })
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'ord-3' } as any)

      const result = await createCheckout('user-3', [
        {
          productId: 'guide-3',
          productType: 'GUIDE',
          name: 'Ghid 3',
          priceEurCents: 1000,
          quantity: 1,
        },
      ])

      expect(result.revolutOrderId).toBe('rev-order-3')
      expect(result.checkoutToken).toBe('checkout-token-3')
    })
  })

  describe('handleOrderComplete', () => {
    it('updates order status to COMPLETED', async () => {
      vi.mocked(getOrder).mockResolvedValue({
        id: 'rev-order-10',
        token: 'tkn',
        state: 'COMPLETED',
        type: 'payment',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        amount: 1000,
        currency: 'EUR',
      })
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'ord-10',
        userId: 'user-10',
        status: 'PENDING',
        user: { id: 'user-10', email: 'u10@example.com', name: 'U10' },
        items: [],
      } as any)

      await handleOrderComplete('rev-order-10')

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-10' },
        data: { status: 'COMPLETED' },
      })
    })

    it('creates GuideAccess for GUIDE product type', async () => {
      vi.mocked(getOrder).mockResolvedValue({
        id: 'rev-order-11',
        token: 'tkn',
        state: 'COMPLETED',
        type: 'payment',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        amount: 5000,
        currency: 'EUR',
      })
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'ord-11',
        userId: 'user-11',
        status: 'PENDING',
        user: { id: 'user-11', email: 'u11@example.com', name: 'U11' },
        items: [{ productType: 'GUIDE', productId: 'guide-11' }],
      } as any)

      await handleOrderComplete('rev-order-11')

      expect(prisma.guideAccess.create).toHaveBeenCalledWith({
        data: { userId: 'user-11', guideId: 'guide-11', orderId: 'ord-11' },
      })
    })

    it('does nothing if order already COMPLETED', async () => {
      vi.mocked(getOrder).mockResolvedValue({
        id: 'rev-order-12',
        token: 'tkn',
        state: 'COMPLETED',
        type: 'payment',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        amount: 5000,
        currency: 'EUR',
      })
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'ord-12',
        userId: 'user-12',
        status: 'COMPLETED',
        user: { id: 'user-12', email: 'u12@example.com', name: 'U12' },
        items: [{ productType: 'GUIDE', productId: 'guide-12' }],
      } as any)

      await handleOrderComplete('rev-order-12')

      expect(prisma.order.update).not.toHaveBeenCalled()
      expect(prisma.guideAccess.create).not.toHaveBeenCalled()
    })

    it('does nothing if Revolut order is not COMPLETED', async () => {
      vi.mocked(getOrder).mockResolvedValue({
        id: 'rev-order-13',
        token: 'tkn',
        state: 'PENDING',
        type: 'payment',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        amount: 5000,
        currency: 'EUR',
      })

      await handleOrderComplete('rev-order-13')

      expect(prisma.order.findFirst).not.toHaveBeenCalled()
      expect(prisma.order.update).not.toHaveBeenCalled()
    })
  })

  describe('getOrderStatus', () => {
    it('returns order with items', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord-20',
        items: [{ id: 'item-1' }],
      } as any)

      const result = await getOrderStatus('ord-20')

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'ord-20' },
        include: { items: true },
      })
      expect(result).toEqual({
        id: 'ord-20',
        items: [{ id: 'item-1' }],
      })
    })
  })
})
