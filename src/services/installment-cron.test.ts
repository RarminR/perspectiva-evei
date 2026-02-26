import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/services/revolut', () => ({
  createOrder: vi.fn(),
}))

vi.mock('@/services/email', () => ({
  sendInstallmentReminderEmail: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/db'
import { sendInstallmentReminderEmail } from '@/services/email'
import { createOrder } from '@/services/revolut'
import { processInstallmentReminders } from './installment-cron'

const NOW = new Date('2026-03-15T12:00:00Z')
const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS)
}

const baseOrder1 = {
  id: 'order-1',
  userId: 'user-1',
  revolutOrderId: 'rev-1',
  revolutCheckoutUrl: 'https://checkout.revolut.com/pay/token-1',
  status: 'COMPLETED',
  totalAmount: 644,
  currency: 'EUR',
  installmentNumber: 1,
  parentOrderId: null,
  createdAt: daysAgo(35),
  updatedAt: daysAgo(35),
  user: { email: 'ana@test.com', name: 'Ana' },
  items: [{ productId: 'edition-1' }],
}

const revolutOrder2Response = {
  id: 'rev-order-2',
  token: 'token-2',
  checkout_url: 'https://checkout.revolut.com/pay/token-2',
  state: 'PENDING',
  type: 'payment',
  created_date: NOW.toISOString(),
  updated_date: NOW.toISOString(),
  amount: 64400,
  currency: 'EUR',
}

describe('processInstallmentReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('finds completed Order 1 installments 30+ days ago and creates Order 2 via Revolut', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([baseOrder1] as any)
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null)
    vi.mocked(createOrder).mockResolvedValue(revolutOrder2Response as any)
    vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-2' } as any)

    const stats = await processInstallmentReminders()

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { installmentNumber: 1, status: 'COMPLETED' },
      include: {
        user: { select: { email: true, name: true } },
        items: { select: { productId: true } },
      },
    })
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 64400,
        currency: 'EUR',
        description: 'Cursul A.D.O. - Rata 2 din 2',
      })
    )
    expect(prisma.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        revolutOrderId: 'rev-order-2',
        totalAmount: 644,
        status: 'PENDING',
        installmentNumber: 2,
        parentOrderId: 'order-1',
      }),
    })
    expect(stats.order2Created).toBe(1)
  })

  it('does NOT create Order 2 if Order 1 was completed less than 30 days ago', async () => {
    const recentOrder1 = { ...baseOrder1, createdAt: daysAgo(20) }
    vi.mocked(prisma.order.findMany).mockResolvedValue([recentOrder1] as any)
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

    const stats = await processInstallmentReminders()

    expect(createOrder).not.toHaveBeenCalled()
    expect(prisma.order.create).not.toHaveBeenCalled()
    expect(stats.order2Created).toBe(0)
  })

  it('does NOT create duplicate Order 2 if one already exists', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([baseOrder1] as any)
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'existing-order-2',
      status: 'COMPLETED',
      installmentNumber: 2,
      parentOrderId: 'order-1',
    } as any)

    const stats = await processInstallmentReminders()

    expect(createOrder).not.toHaveBeenCalled()
    expect(prisma.order.create).not.toHaveBeenCalled()
    expect(stats.order2Created).toBe(0)
  })

  it('sends reminder email at T+33 days (3 days after Order 2) if Order 2 unpaid', async () => {
    const order2 = {
      id: 'order-2',
      status: 'PENDING',
      installmentNumber: 2,
      parentOrderId: 'order-1',
      totalAmount: 644,
      revolutCheckoutUrl: 'https://checkout.revolut.com/pay/token-2',
      createdAt: daysAgo(3),
    }
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      { ...baseOrder1, createdAt: daysAgo(33) },
    ] as any)
    vi.mocked(prisma.order.findFirst).mockResolvedValue(order2 as any)

    const stats = await processInstallmentReminders()

    expect(sendInstallmentReminderEmail).toHaveBeenCalledWith('ana@test.com', {
      name: 'Ana',
      amount: '644 EUR',
      checkoutUrl: 'https://checkout.revolut.com/pay/token-2',
      dueDate: expect.any(String),
    })
    expect(stats.reminders33).toBe(1)
  })

  it('sends reminder email at T+37 days (7 days after Order 2) if still unpaid', async () => {
    const order2 = {
      id: 'order-2',
      status: 'PENDING',
      installmentNumber: 2,
      parentOrderId: 'order-1',
      totalAmount: 644,
      revolutCheckoutUrl: 'https://checkout.revolut.com/pay/token-2',
      createdAt: daysAgo(7),
    }
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      { ...baseOrder1, createdAt: daysAgo(37) },
    ] as any)
    vi.mocked(prisma.order.findFirst).mockResolvedValue(order2 as any)

    const stats = await processInstallmentReminders()

    expect(sendInstallmentReminderEmail).toHaveBeenCalledWith('ana@test.com', {
      name: 'Ana',
      amount: '644 EUR',
      checkoutUrl: 'https://checkout.revolut.com/pay/token-2',
      dueDate: expect.any(String),
    })
    expect(stats.reminders37).toBe(1)
  })

  it('flags Order 2 as FAILED at T+44 days (14+ days after Order 2) for admin attention', async () => {
    const order2 = {
      id: 'order-2',
      status: 'PENDING',
      installmentNumber: 2,
      parentOrderId: 'order-1',
      totalAmount: 644,
      revolutCheckoutUrl: 'https://checkout.revolut.com/pay/token-2',
      createdAt: daysAgo(14),
    }
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      { ...baseOrder1, createdAt: daysAgo(44) },
    ] as any)
    vi.mocked(prisma.order.findFirst).mockResolvedValue(order2 as any)

    const stats = await processInstallmentReminders()

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-2' },
      data: { status: 'FAILED' },
    })
    expect(stats.flagged).toBe(1)
  })

  it('returns aggregated stats for all actions', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([])

    const stats = await processInstallmentReminders()

    expect(stats).toEqual({
      order2Created: 0,
      reminders33: 0,
      reminders37: 0,
      flagged: 0,
    })
  })

  it('handles errors in Order 2 creation gracefully and continues processing', async () => {
    const order1a = { ...baseOrder1, id: 'order-1a', createdAt: daysAgo(35) }
    const order1b = {
      ...baseOrder1,
      id: 'order-1b',
      userId: 'user-2',
      createdAt: daysAgo(40),
      user: { email: 'bob@test.com', name: 'Bob' },
    }
    vi.mocked(prisma.order.findMany).mockResolvedValue([order1a, order1b] as any)
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null)
    vi.mocked(createOrder)
      .mockRejectedValueOnce(new Error('Revolut API down'))
      .mockResolvedValueOnce(revolutOrder2Response as any)
    vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-2b' } as any)

    const stats = await processInstallmentReminders()

    expect(stats.order2Created).toBe(1)
  })
})

describe('POST /api/cron/installments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without valid CRON_SECRET header', async () => {
    vi.stubEnv('CRON_SECRET', 'test-secret-123')
    const { POST } = await import('@/app/api/cron/installments/route')

    const request = new Request('http://localhost/api/cron/installments', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-secret' },
    })

    const response = await POST(request as any)
    expect(response.status).toBe(401)
    vi.unstubAllEnvs()
  })
})
