import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/services/revolut', () => ({
  createOrder: vi.fn(),
  getOrder: vi.fn(),
}))

vi.mock('@/services/email', () => ({
  sendInstallmentReminderEmail: vi.fn(),
}))

import { prisma } from '@/lib/db'
import { sendInstallmentReminderEmail } from '@/services/email'
import { createOrder, getOrder } from '@/services/revolut'
import {
  createInstallmentCheckout,
  createInstallmentOrder2,
  scheduleInstallmentReminders,
} from './installments'

const revolutPendingOrder = {
  id: 'rev-1',
  token: 'token-1',
  checkout_url: 'https://checkout.revolut.com/pay/token-1',
  state: 'PENDING',
  type: 'payment',
  created_date: new Date().toISOString(),
  updated_date: new Date().toISOString(),
  amount: 64400,
  currency: 'EUR',
}

describe('installments service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('createInstallmentCheckout', () => {
    it('creates Order 1 with installmentNumber=1, amount 64400 and PT24H expiration', async () => {
      vi.mocked(createOrder).mockResolvedValue(revolutPendingOrder as any)
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-1' } as any)

      await createInstallmentCheckout('user-1', 'edition-1')

      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 64400,
          currency: 'EUR',
          expirePendingAfter: 'PT24H',
        })
      )
    })

    it('saves Order 1 in DB with status PENDING and installmentNumber=1', async () => {
      vi.mocked(createOrder).mockResolvedValue(revolutPendingOrder as any)
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-1' } as any)

      await createInstallmentCheckout('user-2', 'edition-2')

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-2',
            status: 'PENDING',
            installmentNumber: 1,
            totalAmount: 644,
          }),
        })
      )
    })

    it('returns revolutOrderId and checkoutToken', async () => {
      vi.mocked(createOrder).mockResolvedValue(revolutPendingOrder as any)
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-1' } as any)

      const result = await createInstallmentCheckout('user-3', 'edition-3')

      expect(result.revolutOrderId).toBe('rev-1')
      expect(result.checkoutToken).toBe('token-1')
    })
  })

  describe('createInstallmentOrder2', () => {
    it('creates Order 2 with installmentNumber=2 and parentOrderId set to Order 1', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'COMPLETED',
        user: { email: 'user@example.com', name: 'Ana' },
        items: [{ productId: 'edition-1' }],
      } as any)
      vi.mocked(createOrder).mockResolvedValue({
        ...revolutPendingOrder,
        id: 'rev-2',
        token: 'token-2',
      } as any)
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-2' } as any)

      const result = await createInstallmentOrder2('order-1')

      expect(result.success).toBe(true)
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            installmentNumber: 2,
            parentOrderId: 'order-1',
          }),
        })
      )
    })

    it('creates Order 2 with expire_pending_after=P7D', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'COMPLETED',
        user: { email: 'user@example.com', name: 'Ana' },
        items: [{ productId: 'edition-1' }],
      } as any)
      vi.mocked(createOrder).mockResolvedValue({
        ...revolutPendingOrder,
        id: 'rev-2',
        token: 'token-2',
      } as any)
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-2' } as any)

      await createInstallmentOrder2('order-1')

      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 64400,
          expirePendingAfter: 'P7D',
        })
      )
    })

    it('sends email with checkout URL to user', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'COMPLETED',
        user: { email: 'user@example.com', name: 'Ana' },
        items: [{ productId: 'edition-1' }],
      } as any)
      vi.mocked(createOrder).mockResolvedValue({
        ...revolutPendingOrder,
        id: 'rev-2',
        token: 'token-2',
        checkout_url: 'https://checkout.revolut.com/pay/token-2',
      } as any)
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-2' } as any)

      await createInstallmentOrder2('order-1')

      expect(sendInstallmentReminderEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({
          checkoutUrl: 'https://checkout.revolut.com/pay/token-2',
        })
      )
    })

    it('returns error if Order 1 is not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

      const result = await createInstallmentOrder2('missing-order')

      expect(result).toEqual({ success: false, error: 'Comanda rata 1 nu a fost găsită.' })
      expect(createOrder).not.toHaveBeenCalled()
    })

    it('returns error if Order 1 is not COMPLETED', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
        user: { email: 'user@example.com', name: 'Ana' },
        items: [{ productId: 'edition-1' }],
      } as any)

      const result = await createInstallmentOrder2('order-1')

      expect(result).toEqual({ success: false, error: 'Rata 1 nu a fost plătită.' })
      expect(createOrder).not.toHaveBeenCalled()
    })
  })

  describe('scheduleInstallmentReminders', () => {
    it('sends reminder email at T+33 days (3 days after Order 2 is created)', async () => {
      const createdAt = new Date('2026-01-01T10:00:00.000Z')
      vi.setSystemTime(new Date('2026-01-04T10:00:00.000Z'))

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-2',
        revolutOrderId: 'rev-2',
        status: 'PENDING',
        createdAt,
        user: { email: 'user@example.com', name: 'Ana' },
      } as any)
      vi.mocked(getOrder).mockResolvedValue({
        ...revolutPendingOrder,
        id: 'rev-2',
        token: 'token-2',
      } as any)

      await scheduleInstallmentReminders('order-2')

      expect(sendInstallmentReminderEmail).toHaveBeenCalledTimes(1)
      expect(sendInstallmentReminderEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({
          checkoutUrl: expect.stringContaining('https://checkout.revolut.com/pay/'),
        })
      )
    })

    it('sends final reminder at T+37 days', async () => {
      const createdAt = new Date('2026-01-01T10:00:00.000Z')
      vi.setSystemTime(new Date('2026-01-08T10:00:00.000Z'))

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-2',
        revolutOrderId: 'rev-2',
        status: 'PENDING',
        createdAt,
        user: { email: 'user@example.com', name: 'Ana' },
      } as any)
      vi.mocked(getOrder).mockResolvedValue({
        ...revolutPendingOrder,
        id: 'rev-2',
        token: 'token-2',
      } as any)

      await scheduleInstallmentReminders('order-2')

      expect(sendInstallmentReminderEmail).toHaveBeenCalledTimes(1)
      expect(sendInstallmentReminderEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({
          checkoutUrl: expect.stringContaining('https://checkout.revolut.com/pay/'),
        })
      )
    })
  })
})
