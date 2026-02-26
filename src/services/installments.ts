import { OrderItemType } from '@prisma/client'

import { prisma } from '@/lib/db'
import { sendInstallmentReminderEmail } from '@/services/email'
import { createOrder, getOrder } from '@/services/revolut'

const INSTALLMENT_AMOUNT_CENTS = 64400
const INSTALLMENT_AMOUNT_EUR = 644
const CHECKOUT_FALLBACK_BASE_URL = 'https://checkout.revolut.com/pay/'

function parseExpirePendingAfter(duration: string): Date | null {
  if (duration.startsWith('PT') && duration.endsWith('H')) {
    const hours = Number(duration.slice(2, -1))
    if (!Number.isFinite(hours) || hours <= 0) {
      return null
    }

    return new Date(Date.now() + hours * 60 * 60 * 1000)
  }

  if (duration.startsWith('P') && duration.endsWith('D')) {
    const days = Number(duration.slice(1, -1))
    if (!Number.isFinite(days) || days <= 0) {
      return null
    }

    return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  }

  return null
}

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getCheckoutUrl(checkoutUrl: string | undefined, token: string): string {
  return checkoutUrl || `${CHECKOUT_FALLBACK_BASE_URL}${token}`
}

export async function createInstallmentCheckout(
  userId: string,
  editionId: string
): Promise<{ revolutOrderId: string; checkoutToken: string; checkoutUrl?: string }> {
  const expirePendingAfter = 'PT24H'

  const revolutOrder = await createOrder({
    amount: INSTALLMENT_AMOUNT_CENTS,
    currency: 'EUR',
    description: 'Cursul A.D.O. - Rata 1 din 2',
    expirePendingAfter,
  })

  await prisma.order.create({
    data: {
      userId,
      revolutOrderId: revolutOrder.id,
      revolutCheckoutUrl: revolutOrder.checkout_url,
      totalAmount: INSTALLMENT_AMOUNT_EUR,
      currency: 'EUR',
      status: 'PENDING',
      installmentNumber: 1,
      expiresPendingAfter: parseExpirePendingAfter(expirePendingAfter),
      items: {
        create: [
          {
            productType: OrderItemType.COURSE,
            productId: editionId,
            quantity: 1,
            unitPrice: INSTALLMENT_AMOUNT_EUR,
          },
        ],
      },
    },
  })

  return {
    revolutOrderId: revolutOrder.id,
    checkoutToken: revolutOrder.token,
    checkoutUrl: revolutOrder.checkout_url,
  }
}

export async function createInstallmentOrder2(
  parentOrderId: string
): Promise<{ success: boolean; error?: string; revolutOrderId?: string; checkoutUrl?: string }> {
  const parentOrder = await prisma.order.findUnique({
    where: { id: parentOrderId },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
      items: {
        select: {
          productId: true,
        },
      },
    },
  })

  if (!parentOrder) {
    return { success: false, error: 'Comanda rata 1 nu a fost găsită.' }
  }

  if (parentOrder.status !== 'COMPLETED') {
    return { success: false, error: 'Rata 1 nu a fost plătită.' }
  }

  const expirePendingAfter = 'P7D'
  const revolutOrder = await createOrder({
    amount: INSTALLMENT_AMOUNT_CENTS,
    currency: 'EUR',
    description: 'Cursul A.D.O. - Rata 2 din 2',
    expirePendingAfter,
  })

  await prisma.order.create({
    data: {
      userId: parentOrder.userId,
      revolutOrderId: revolutOrder.id,
      revolutCheckoutUrl: revolutOrder.checkout_url,
      totalAmount: INSTALLMENT_AMOUNT_EUR,
      currency: 'EUR',
      status: 'PENDING',
      installmentNumber: 2,
      parentOrderId,
      expiresPendingAfter: parseExpirePendingAfter(expirePendingAfter),
      items: {
        create: [
          {
            productType: OrderItemType.COURSE,
            productId: parentOrder.items[0]?.productId || parentOrderId,
            quantity: 1,
            unitPrice: INSTALLMENT_AMOUNT_EUR,
          },
        ],
      },
    },
  })

  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const checkoutUrl = getCheckoutUrl(revolutOrder.checkout_url, revolutOrder.token)
  await sendInstallmentReminderEmail(parentOrder.user.email, {
    name: parentOrder.user.name || 'Dragă cursant',
    amount: `${INSTALLMENT_AMOUNT_EUR} EUR`,
    checkoutUrl,
    dueDate: toIsoDate(dueDate),
  })

  return {
    success: true,
    revolutOrderId: revolutOrder.id,
    checkoutUrl,
  }
}

export async function scheduleInstallmentReminders(order2Id: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: order2Id },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  })

  if (!order || order.status === 'COMPLETED') {
    return
  }

  const now = Date.now()
  const createdAt = new Date(order.createdAt).getTime()
  const daysSinceOrder2Created = Math.floor((now - createdAt) / (24 * 60 * 60 * 1000))

  if (daysSinceOrder2Created !== 3 && daysSinceOrder2Created !== 7) {
    return
  }

  const revolutOrder = await getOrder(order.revolutOrderId || '')
  if (revolutOrder.state === 'COMPLETED') {
    return
  }

  const dueDate = new Date(createdAt + 7 * 24 * 60 * 60 * 1000)
  await sendInstallmentReminderEmail(order.user.email, {
    name: order.user.name || 'Dragă cursant',
    amount: `${INSTALLMENT_AMOUNT_EUR} EUR`,
    checkoutUrl: getCheckoutUrl(revolutOrder.checkout_url, revolutOrder.token),
    dueDate: toIsoDate(dueDate),
  })
}
