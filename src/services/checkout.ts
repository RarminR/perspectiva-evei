import { OrderItemType } from '@prisma/client'

import { prisma } from '@/lib/db'
import { createOrder, getOrder } from '@/services/revolut'
import { createInvoice } from '@/services/smartbill'
import { fulfillOrder } from '@/services/order-fulfillment'
import { resolveProductNames, nameForItem } from '@/services/invoice-pipeline'
import { incrementPromoUse, validatePromoCode } from '@/services/promo'
import type { CreateOrderParams } from '@/types/revolut'

export interface CheckoutItem {
  productId: string
  productType: 'COURSE' | 'GUIDE' | 'BUNDLE' | 'SESSION' | 'PRODUCT'
  name: string
  priceEurCents: number
  quantity: number
}

export interface BillingInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  county: string
  city: string
  address: string
  postalCode: string
  cnp?: string
}

export interface CreateCheckoutResult {
  orderId: string
  revolutOrderId: string
  checkoutToken: string
  checkoutUrl: string
  bypassed?: boolean
}

export type PaymentType = 'full' | 'installment'

function parseExpirePendingAfter(duration: string): Date | null {
  if (!duration.startsWith('PT') || !duration.endsWith('H')) {
    return null
  }

  const hours = Number(duration.slice(2, -1))
  if (!Number.isFinite(hours) || hours <= 0) {
    return null
  }

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + hours)
  return expiresAt
}

export async function createCheckout(
  userId: string,
  items: CheckoutItem[],
  promoCode?: string,
  billing?: BillingInfo,
  paymentType: PaymentType = 'full'
): Promise<CreateCheckoutResult> {
  const isInstallmentCourse =
    paymentType === 'installment' && items.some((i) => i.productType === 'COURSE')
  const grossCents = items.reduce((sum, item) => sum + item.priceEurCents * item.quantity, 0)
  const billingJson = billing ? (billing as unknown as Record<string, string>) : undefined

  // Apply promo code (if any)
  let totalCents = grossCents
  let appliedPromo: { code: string } | null = null
  const normalizedCode = promoCode?.trim()
  if (normalizedCode) {
    const itemsForValidation = items.map((i) => ({
      productType: i.productType,
      productId: i.productId,
    }))
    const validation = await validatePromoCode(normalizedCode, grossCents / 100, itemsForValidation)
    if (!validation.valid) {
      throw new Error(validation.error || 'Codul promoțional nu este valid.')
    }
    totalCents = Math.max(0, Math.round((validation.finalAmount ?? grossCents / 100) * 100))
    appliedPromo = { code: normalizedCode }
  }

  // Adjust per-item unit prices proportionally so line items sum to the discounted total
  const discountRatio = grossCents > 0 ? totalCents / grossCents : 1
  const discountedItems = items.map((item) => ({
    ...item,
    unitPriceCents: Math.round(item.priceEurCents * discountRatio),
  }))

  if (process.env.BYPASS_PAYMENT === 'true') {
    const order = await prisma.order.create({
      data: {
        userId,
        revolutOrderId: `dev-bypass-${Date.now()}`,
        status: 'PENDING',
        totalAmount: totalCents / 100,
        currency: 'EUR',
        shippingAddress: billingJson,
        ...(isInstallmentCourse && { installmentNumber: 1 }),
        items: {
          create: discountedItems.map((item) => ({
            productId: item.productId,
            productType: item.productType as OrderItemType,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents / 100,
          })),
        },
      },
    })

    if (appliedPromo) {
      try {
        await incrementPromoUse(appliedPromo.code)
      } catch (err) {
        console.error('Failed to increment promo use:', err)
      }
    }

    await fulfillOrder(order.id)

    return {
      orderId: order.id,
      revolutOrderId: order.revolutOrderId ?? '',
      checkoutToken: '',
      checkoutUrl: '',
      bypassed: true,
    }
  }

  const expirePendingAfter = 'PT24H'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://perspectiva-evei.vercel.app'

  const orderParams: CreateOrderParams = {
    amount: totalCents,
    currency: 'EUR',
    description: items.map((item) => item.name).join(', '),
    expirePendingAfter,
    merchantOrderReference: `user-${userId}-${Date.now()}`,
    redirectUrl: `${appUrl}/checkout/success`,
  }

  const revolutOrder = await createOrder(orderParams)

  const order = await prisma.order.create({
    data: {
      userId,
      revolutOrderId: revolutOrder.id,
      revolutCheckoutUrl: revolutOrder.checkout_url,
      status: 'PENDING',
      totalAmount: totalCents / 100,
      currency: 'EUR',
      expiresPendingAfter: parseExpirePendingAfter(expirePendingAfter),
      shippingAddress: billingJson,
      ...(isInstallmentCourse && { installmentNumber: 1 }),
      items: {
        create: discountedItems.map((item) => ({
          productId: item.productId,
          productType: item.productType as OrderItemType,
          quantity: item.quantity,
          unitPrice: item.unitPriceCents / 100,
        })),
      },
    },
  })

  if (appliedPromo) {
    try {
      await incrementPromoUse(appliedPromo.code)
    } catch (err) {
      console.error('Failed to increment promo use:', err)
    }
  }

  return {
    orderId: order.id,
    revolutOrderId: revolutOrder.id,
    checkoutToken: revolutOrder.token,
    checkoutUrl: revolutOrder.checkout_url || '',
  }
}

async function fulfillItem(userId: string, orderId: string, item: { productType: string; productId: string }) {
  switch (item.productType) {
    case 'GUIDE':
      await prisma.guideAccess.create({
        data: { userId, guideId: item.productId, orderId },
      })
      break

    case 'BUNDLE': {
      const bundle = await prisma.bundle.findUnique({
        where: { id: item.productId },
        include: { items: true },
      })

      if (!bundle) {
        break
      }

      for (const bundleItem of bundle.items) {
        await prisma.guideAccess.upsert({
          where: { userId_guideId: { userId, guideId: bundleItem.guideId } },
          create: { userId, guideId: bundleItem.guideId, orderId },
          update: { orderId },
        })
      }
      break
    }

    case 'COURSE':
    case 'SESSION':
    case 'PRODUCT':
      break

    default:
      break
  }
}

async function triggerInvoiceAsync(order: {
  id: string
  user: { name: string; email: string }
  items: Array<{ productType: string; productId: string; quantity: number; unitPrice: number }>
  shippingAddress?: unknown
}) {
  try {
    const billing = (order.shippingAddress ?? null) as Partial<BillingInfo> | null
    const fullName =
      billing?.firstName || billing?.lastName
        ? `${billing?.firstName ?? ''} ${billing?.lastName ?? ''}`.trim()
        : order.user.name || 'Client'

    const nameLookup = await resolveProductNames(order.items)

    const invoice = await createInvoice({
      companyVatCode: process.env.SMARTBILL_COMPANY_VAT_CODE || '',
      client: {
        name: fullName,
        vatCode: billing?.cnp?.trim() || '0000000000000',
        isTaxPayer: false,
        email: billing?.email || order.user.email,
        phone: billing?.phone,
        address: billing?.address,
        city: billing?.city,
        county: billing?.county,
        country: billing?.country || 'Romania',
      },
      issueDate: new Date().toISOString().split('T')[0],
      seriesName: process.env.SMARTBILL_INVOICE_SERIES || '',
      products: order.items.map((item) => ({
        name: nameForItem(item, nameLookup),
        measuringUnitName: 'buc',
        currency: 'EUR',
        quantity: item.quantity,
        price: item.unitPrice,
        isTaxIncluded: true,
        taxPercentage: 21,
      })),
    })

    await prisma.invoice.create({
      data: {
        orderId: order.id,
        smartbillSeries: invoice.series || null,
        smartbillNumber: invoice.number || null,
        smartbillUrl: invoice.url || null,
        status: 'CREATED',
      },
    })
  } catch (error) {
    await prisma.invoice.create({
      data: {
        orderId: order.id,
        status: 'FAILED',
        errorText: error instanceof Error ? error.message : 'Unknown invoice error',
      },
    })
  }
}

export async function handleOrderComplete(revolutOrderId: string): Promise<void> {
  const revolutOrder = await getOrder(revolutOrderId)
  if (revolutOrder.state !== 'COMPLETED') {
    return
  }

  const order = await prisma.order.findFirst({
    where: { revolutOrderId },
    include: {
      items: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!order || order.status === 'COMPLETED') {
    return
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'COMPLETED' },
  })

  for (const item of order.items) {
    await fulfillItem(order.userId, order.id, item)
  }

  void triggerInvoiceAsync(order)
}

export async function getOrderStatus(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
}
