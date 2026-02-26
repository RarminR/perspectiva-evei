import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    courseEnrollment: {
      upsert: vi.fn(),
    },
    guideAccess: {
      upsert: vi.fn(),
    },
  },
}))

vi.mock('@/services/revolut', () => ({
  getOrder: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}))

vi.mock('./email', () => ({
  sendOrderConfirmationEmail: vi.fn(),
}))

import { prisma } from '@/lib/db'
import { getOrder, verifyWebhookSignature } from '@/services/revolut'
import { sendOrderConfirmationEmail } from './email'
import { fulfillOrder } from './order-fulfillment'
import { pollPendingOrders } from './order-polling'

describe('Order fulfillment + polling fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fulfillOrder grants CourseEnrollment for COURSE order item', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord-1',
      userId: 'user-1',
      status: 'PENDING',
      totalAmount: 120,
      items: [{ productType: 'COURSE', productId: 'edition-1', quantity: 1, unitPrice: 120 }],
      user: { name: 'Ana', email: 'ana@example.com' },
    } as any)

    await fulfillOrder('ord-1')

    expect(prisma.courseEnrollment.upsert).toHaveBeenCalledWith({
      where: { userId_editionId: { userId: 'user-1', editionId: 'edition-1' } },
      update: { orderId: 'ord-1', status: 'ACTIVE' },
      create: expect.objectContaining({
        userId: 'user-1',
        editionId: 'edition-1',
        orderId: 'ord-1',
      }),
    })
  })

  it('fulfillOrder grants GuideAccess for GUIDE order item', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord-2',
      userId: 'user-2',
      status: 'PENDING',
      totalAmount: 49,
      items: [{ productType: 'GUIDE', productId: 'guide-1', quantity: 1, unitPrice: 49 }],
      user: { name: 'Elena', email: 'elena@example.com' },
    } as any)

    await fulfillOrder('ord-2')

    expect(prisma.guideAccess.upsert).toHaveBeenCalledWith({
      where: { userId_guideId: { userId: 'user-2', guideId: 'guide-1' } },
      update: { orderId: 'ord-2' },
      create: { userId: 'user-2', guideId: 'guide-1', orderId: 'ord-2' },
    })
  })

  it('fulfillOrder is idempotent and no-ops when already COMPLETED', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord-3',
      userId: 'user-3',
      status: 'COMPLETED',
      totalAmount: 29,
      items: [{ productType: 'GUIDE', productId: 'guide-2', quantity: 1, unitPrice: 29 }],
      user: { name: 'Mara', email: 'mara@example.com' },
    } as any)

    await fulfillOrder('ord-3')

    expect(prisma.order.update).not.toHaveBeenCalled()
    expect(prisma.courseEnrollment.upsert).not.toHaveBeenCalled()
    expect(prisma.guideAccess.upsert).not.toHaveBeenCalled()
  })

  it('fulfillOrder sends order confirmation email', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord-4',
      userId: 'user-4',
      status: 'PENDING',
      totalAmount: 79,
      items: [{ productType: 'GUIDE', productId: 'guide-3', quantity: 1, unitPrice: 79 }],
      user: { name: 'Ioana', email: 'ioana@example.com' },
    } as any)

    await fulfillOrder('ord-4')

    expect(sendOrderConfirmationEmail).toHaveBeenCalledOnce()
  })

  it('pollPendingOrders fetches orders older than 35 minutes', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([])

    await pollPendingOrders()

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PENDING',
          revolutOrderId: { not: null },
          createdAt: { lt: expect.any(Date) },
        }),
      })
    )
  })

  it('pollPendingOrders calls getOrder for each pending order', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      { id: 'ord-5', revolutOrderId: 'rev-5' },
      { id: 'ord-6', revolutOrderId: 'rev-6' },
    ] as any)
    vi.mocked(getOrder).mockResolvedValue({ state: 'PENDING' } as any)

    await pollPendingOrders()

    expect(getOrder).toHaveBeenCalledTimes(2)
    expect(getOrder).toHaveBeenCalledWith('rev-5')
    expect(getOrder).toHaveBeenCalledWith('rev-6')
  })

  it('pollPendingOrders fulfills orders that are COMPLETED in Revolut', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([{ id: 'ord-7', revolutOrderId: 'rev-7' }] as any)
    vi.mocked(getOrder).mockResolvedValue({ state: 'COMPLETED' } as any)
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord-7',
      userId: 'user-7',
      status: 'PENDING',
      totalAmount: 10,
      items: [],
      user: { name: 'Lia', email: 'lia@example.com' },
    } as any)

    const result = await pollPendingOrders()

    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'ord-7' }, data: { status: 'COMPLETED' } })
    expect(result.fulfilled).toBe(1)
  })

  it('pollPendingOrders skips orders that are still PENDING in Revolut', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([{ id: 'ord-8', revolutOrderId: 'rev-8' }] as any)
    vi.mocked(getOrder).mockResolvedValue({ state: 'PENDING' } as any)

    const result = await pollPendingOrders()

    expect(prisma.order.update).not.toHaveBeenCalled()
    expect(result.fulfilled).toBe(0)
  })

  it('Webhook: valid signature returns 200', async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue(true)
    vi.mocked(prisma.order.findFirst).mockResolvedValue({ id: 'ord-9' } as any)

    const { POST } = await import('@/app/api/webhooks/revolut/route')
    const req = new Request('http://localhost/api/webhooks/revolut', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'revolut-signature': 'v1=abc,ts=123',
      },
      body: JSON.stringify({ event: 'ORDER_COMPLETED', order_id: 'rev-9' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('Webhook: invalid signature returns 401', async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue(false)

    const { POST } = await import('@/app/api/webhooks/revolut/route')
    const req = new Request('http://localhost/api/webhooks/revolut', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'revolut-signature': 'bad',
      },
      body: JSON.stringify({ event: 'ORDER_COMPLETED', order_id: 'rev-10' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
