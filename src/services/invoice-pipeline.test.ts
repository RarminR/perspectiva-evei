import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    invoice: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

vi.mock('@/services/smartbill', () => ({
  createInvoice: vi.fn(),
}))

import { prisma } from '@/lib/db'
import { createInvoice } from '@/services/smartbill'

import { processInvoiceQueue, queueInvoice, retryFailedInvoice } from './invoice-pipeline'

function makePendingInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    orderId: 'order-1',
    status: 'PENDING',
    order: {
      user: {
        name: 'Ion Popescu',
        email: 'ion@example.com',
      },
      totalAmount: 99,
      items: [
        {
          productId: 'guide-ado',
          unitPrice: 99,
          quantity: 1,
        },
      ],
    },
    ...overrides,
  }
}

describe('invoice pipeline', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      SMARTBILL_COMPANY_VAT_CODE: 'RO1234567',
      SMARTBILL_INVOICE_SERIES: 'EVEI',
    }
  })

  it('queueInvoice creates PENDING invoice when missing', async () => {
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null)

    await queueInvoice('order-1')

    expect(prisma.invoice.findFirst).toHaveBeenCalledWith({ where: { orderId: 'order-1' } })
    expect(prisma.invoice.create).toHaveBeenCalledWith({
      data: { orderId: 'order-1', status: 'PENDING' },
    })
  })

  it('queueInvoice is idempotent for same order', async () => {
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue({ id: 'inv-existing' } as never)

    await queueInvoice('order-1')

    expect(prisma.invoice.create).not.toHaveBeenCalled()
  })

  it('processInvoiceQueue calls SmartBill createInvoice for PENDING invoices', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([makePendingInvoice()] as never)
    vi.mocked(createInvoice).mockResolvedValue({
      errorText: '',
      message: 'ok',
      number: '10',
      series: 'EVEI',
      url: 'https://smartbill.test/inv/10',
    })

    await processInvoiceQueue()

    expect(createInvoice).toHaveBeenCalledTimes(1)
  })

  it('processInvoiceQueue updates invoice to CREATED on success', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([makePendingInvoice()] as never)
    vi.mocked(createInvoice).mockResolvedValue({
      errorText: '',
      message: 'ok',
      number: '11',
      series: 'EVEI',
      url: 'https://smartbill.test/inv/11',
    })

    const result = await processInvoiceQueue()

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        status: 'CREATED',
        smartbillSeries: 'EVEI',
        smartbillNumber: '11',
        smartbillUrl: 'https://smartbill.test/inv/11',
        errorText: null,
      },
    })
    expect(result).toEqual({ processed: 1, succeeded: 1, failed: 0 })
  })

  it('processInvoiceQueue updates invoice to FAILED with errorText on failure', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([makePendingInvoice()] as never)
    vi.mocked(createInvoice).mockRejectedValue(new Error('SmartBill timeout'))

    const result = await processInvoiceQueue()

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        status: 'FAILED',
        errorText: 'SmartBill timeout',
      },
    })
    expect(result).toEqual({ processed: 1, succeeded: 0, failed: 1 })
  })

  it('processInvoiceQueue treats HTTP 200 with errorText as failure', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([makePendingInvoice()] as never)
    vi.mocked(createInvoice).mockResolvedValue({
      errorText: 'Seria nu exista',
      message: '',
      number: '',
      series: '',
    })

    const result = await processInvoiceQueue()

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        status: 'FAILED',
        errorText: 'Seria nu exista',
      },
    })
    expect(result).toEqual({ processed: 1, succeeded: 0, failed: 1 })
  })

  it('processInvoiceQueue respects rate limit by processing at most 25 invoices per run', async () => {
    const allPending = Array.from({ length: 30 }, (_, index) =>
      makePendingInvoice({ id: `inv-${index + 1}`, orderId: `order-${index + 1}` })
    )

    vi.mocked(prisma.invoice.findMany).mockResolvedValue(allPending.slice(0, 25) as never)
    vi.mocked(createInvoice).mockResolvedValue({
      errorText: '',
      message: 'ok',
      number: '12',
      series: 'EVEI',
      url: 'https://smartbill.test/inv/12',
    })

    const result = await processInvoiceQueue()

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'PENDING' },
        take: 25,
      })
    )
    expect(createInvoice).toHaveBeenCalledTimes(25)
    expect(result.processed).toBe(25)
  })

  it('retryFailedInvoice resets FAILED invoice to PENDING and reprocesses', async () => {
    vi.mocked(prisma.invoice.updateMany).mockResolvedValue({ count: 1 } as never)
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([
      makePendingInvoice({ id: 'inv-retry', orderId: 'order-retry' }),
    ] as never)
    vi.mocked(createInvoice).mockResolvedValue({
      errorText: '',
      message: 'ok',
      number: '20',
      series: 'EVEI',
      url: 'https://smartbill.test/inv/20',
    })

    await retryFailedInvoice('inv-retry')

    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: { id: 'inv-retry', status: 'FAILED' },
      data: { status: 'PENDING', errorText: null },
    })
    expect(createInvoice).toHaveBeenCalledTimes(1)
  })

  it('uses isTaxIncluded=true and gross prices for invoice lines', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([
      makePendingInvoice({
        order: {
          user: { name: 'Ana', email: 'ana@example.com' },
          totalAmount: 149,
          items: [
            { productId: 'guide-1', unitPrice: 99, quantity: 1 },
            { productId: 'guide-2', unitPrice: 50, quantity: 1 },
          ],
        },
      }),
    ] as never)
    vi.mocked(createInvoice).mockResolvedValue({
      errorText: '',
      message: 'ok',
      number: '21',
      series: 'EVEI',
    })

    await processInvoiceQueue()

    const payload = vi.mocked(createInvoice).mock.calls[0][0]
    expect(payload.products[0].price).toBe(99)
    expect(payload.products[0].isTaxIncluded).toBe(true)
    expect(payload.products[1].price).toBe(50)
    expect(payload.products[1].isTaxIncluded).toBe(true)
  })

  it('uses B2C vatCode 0000000000000 for client', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([makePendingInvoice()] as never)
    vi.mocked(createInvoice).mockResolvedValue({
      errorText: '',
      message: 'ok',
      number: '22',
      series: 'EVEI',
    })

    await processInvoiceQueue()

    const payload = vi.mocked(createInvoice).mock.calls[0][0]
    expect(payload.client.vatCode).toBe('0000000000000')
    expect(payload.client.isTaxPayer).toBe(false)
  })
})
