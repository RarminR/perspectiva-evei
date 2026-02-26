import { prisma } from '@/lib/db'
import { createInvoice } from '@/services/smartbill'

const RATE_LIMIT = 25

export async function queueInvoice(orderId: string): Promise<void> {
  const existing = await prisma.invoice.findFirst({ where: { orderId } })
  if (existing) {
    return
  }

  await prisma.invoice.create({
    data: {
      orderId,
      status: 'PENDING',
    },
  })
}

export async function processInvoiceQueue(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const pendingInvoices = await prisma.invoice.findMany({
    where: { status: 'PENDING' },
    include: {
      order: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          items: true,
        },
      },
    },
    take: RATE_LIMIT,
    orderBy: { createdAt: 'asc' },
  })

  let succeeded = 0
  let failed = 0

  for (const invoice of pendingInvoices) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const payload = {
        companyVatCode: process.env.SMARTBILL_COMPANY_VAT_CODE || '',
        client: {
          name: invoice.order.user.name || 'Client',
          vatCode: '0000000000000',
          isTaxPayer: false,
          country: 'Romania',
          email: invoice.order.user.email,
        },
        issueDate: today,
        seriesName: process.env.SMARTBILL_INVOICE_SERIES || 'EVEI',
        products: invoice.order.items.map((item) => ({
          name: item.productId,
          measuringUnitName: 'buc',
          currency: 'EUR',
          quantity: item.quantity,
          price: item.unitPrice,
          isTaxIncluded: true,
          taxPercentage: 21,
          taxName: 'TVA',
        })),
        payment: {
          value: invoice.order.totalAmount,
          type: 'Card',
          isCash: false,
        },
      }

      const response = await createInvoice(payload)
      if (response.errorText && response.errorText.trim() !== '') {
        throw new Error(response.errorText)
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'CREATED',
          smartbillSeries: response.series || null,
          smartbillNumber: response.number || null,
          smartbillUrl: response.url || null,
          errorText: null,
        },
      })

      succeeded += 1
    } catch (error) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'FAILED',
          errorText: error instanceof Error ? error.message : 'Unknown invoice error',
        },
      })
      failed += 1
    }
  }

  return {
    processed: pendingInvoices.length,
    succeeded,
    failed,
  }
}

export async function retryFailedInvoice(invoiceId: string): Promise<void> {
  await prisma.invoice.updateMany({
    where: {
      id: invoiceId,
      status: 'FAILED',
    },
    data: {
      status: 'PENDING',
      errorText: null,
    },
  })

  await processInvoiceQueue()
}
