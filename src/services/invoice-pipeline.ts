import { prisma } from '@/lib/db'
import { createInvoice } from '@/services/smartbill'
import type { BillingInfo } from '@/services/checkout'

const RATE_LIMIT = 25

type OrderItemForLookup = {
  productType: string
  productId: string
}

export async function resolveProductNames(
  items: OrderItemForLookup[]
): Promise<Map<string, string>> {
  const guideIds = items.filter((i) => i.productType === 'GUIDE').map((i) => i.productId)
  const bundleIds = items.filter((i) => i.productType === 'BUNDLE').map((i) => i.productId)
  const editionIds = items.filter((i) => i.productType === 'COURSE').map((i) => i.productId)
  const productIds = items.filter((i) => i.productType === 'PRODUCT').map((i) => i.productId)

  const [guides, bundles, editions, products] = await Promise.all([
    guideIds.length
      ? prisma.guide.findMany({ where: { id: { in: guideIds } }, select: { id: true, title: true } })
      : Promise.resolve([]),
    bundleIds.length
      ? prisma.bundle.findMany({ where: { id: { in: bundleIds } }, select: { id: true, title: true } })
      : Promise.resolve([]),
    editionIds.length
      ? prisma.courseEdition.findMany({
          where: { id: { in: editionIds } },
          select: { id: true, editionNumber: true, course: { select: { title: true } } },
        })
      : Promise.resolve([]),
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true } })
      : Promise.resolve([]),
  ])

  const map = new Map<string, string>()
  for (const g of guides) map.set(`GUIDE:${g.id}`, g.title)
  for (const b of bundles) map.set(`BUNDLE:${b.id}`, b.title)
  for (const e of editions) {
    map.set(`COURSE:${e.id}`, `${e.course.title} — Ediția ${e.editionNumber}`)
  }
  for (const p of products) map.set(`PRODUCT:${p.id}`, p.title)
  return map
}

export function nameForItem(
  item: { productType: string; productId: string },
  lookup: Map<string, string>
): string {
  return (
    lookup.get(`${item.productType}:${item.productId}`) ||
    (item.productType === 'SESSION' ? 'Ședință 1:1' : 'Produs digital')
  )
}

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
      const billing = (invoice.order.shippingAddress ?? null) as Partial<BillingInfo> | null
      const fullName =
        billing?.firstName || billing?.lastName
          ? `${billing?.firstName ?? ''} ${billing?.lastName ?? ''}`.trim()
          : invoice.order.user.name || 'Client'

      const nameLookup = await resolveProductNames(invoice.order.items)

      const payload = {
        companyVatCode: process.env.SMARTBILL_COMPANY_VAT_CODE || '',
        client: {
          name: fullName,
          vatCode: billing?.cnp?.trim() || '0000000000000',
          isTaxPayer: false,
          country: billing?.country || 'Romania',
          email: billing?.email || invoice.order.user.email,
          phone: billing?.phone,
          address: billing?.address,
          city: billing?.city,
          county: billing?.county,
        },
        issueDate: today,
        seriesName: process.env.SMARTBILL_INVOICE_SERIES || 'EVEI',
        products: invoice.order.items.map((item) => ({
          name: nameForItem(item, nameLookup),
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
