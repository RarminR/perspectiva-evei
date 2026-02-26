import { prisma } from '@/lib/db'
import { sendInstallmentReminderEmail } from '@/services/email'
import { createOrder } from '@/services/revolut'

const INSTALLMENT_AMOUNT_CENTS = 64400
const INSTALLMENT_AMOUNT_EUR = 644
const DAY_MS = 24 * 60 * 60 * 1000

export interface InstallmentCronStats {
  order2Created: number
  reminders33: number
  reminders37: number
  flagged: number
}

export async function processInstallmentReminders(): Promise<InstallmentCronStats> {
  const now = Date.now()
  const stats: InstallmentCronStats = {
    order2Created: 0,
    reminders33: 0,
    reminders37: 0,
    flagged: 0,
  }

  const order1s = await prisma.order.findMany({
    where: { installmentNumber: 1, status: 'COMPLETED' },
    include: {
      user: { select: { email: true, name: true } },
      items: { select: { productId: true } },
    },
  })

  for (const order1 of order1s) {
    const daysSinceOrder1 = Math.floor(
      (now - order1.createdAt.getTime()) / DAY_MS
    )

    const order2 = await prisma.order.findFirst({
      where: { parentOrderId: order1.id, installmentNumber: 2 },
    })

    if (!order2 && daysSinceOrder1 >= 30) {
      try {
        const revolutOrder = await createOrder({
          amount: INSTALLMENT_AMOUNT_CENTS,
          currency: order1.currency,
          description: 'Cursul A.D.O. - Rata 2 din 2',
          expirePendingAfter: 'P7D',
        })

        await prisma.order.create({
          data: {
            userId: order1.userId,
            revolutOrderId: revolutOrder.id,
            revolutCheckoutUrl: revolutOrder.checkout_url,
            totalAmount: INSTALLMENT_AMOUNT_EUR,
            currency: order1.currency,
            status: 'PENDING',
            installmentNumber: 2,
            parentOrderId: order1.id,
            items: {
              create: [
                {
                  productType: 'COURSE',
                  productId: order1.items[0]?.productId || order1.id,
                  quantity: 1,
                  unitPrice: INSTALLMENT_AMOUNT_EUR,
                },
              ],
            },
          },
        })
        stats.order2Created++
      } catch (e) {
        console.error('Failed to create Order 2 for', order1.id, e)
      }
    } else if (order2 && order2.status === 'PENDING') {
      const daysSinceOrder2 = Math.floor(
        (now - order2.createdAt.getTime()) / DAY_MS
      )

      try {
        if (daysSinceOrder2 >= 14) {
          await prisma.order.update({
            where: { id: order2.id },
            data: { status: 'FAILED' },
          })
          stats.flagged++
        } else if (daysSinceOrder2 >= 7 && daysSinceOrder2 < 10) {
          const dueDate = new Date(
            order2.createdAt.getTime() + 14 * DAY_MS
          )
          await sendInstallmentReminderEmail(order1.user.email, {
            name: order1.user.name || 'Dragă cursant',
            amount: `${INSTALLMENT_AMOUNT_EUR} EUR`,
            checkoutUrl: order2.revolutCheckoutUrl || '',
            dueDate: dueDate.toISOString().split('T')[0],
          })
          stats.reminders37++
        } else if (daysSinceOrder2 >= 3 && daysSinceOrder2 < 6) {
          const dueDate = new Date(
            order2.createdAt.getTime() + 14 * DAY_MS
          )
          await sendInstallmentReminderEmail(order1.user.email, {
            name: order1.user.name || 'Dragă cursant',
            amount: `${INSTALLMENT_AMOUNT_EUR} EUR`,
            checkoutUrl: order2.revolutCheckoutUrl || '',
            dueDate: dueDate.toISOString().split('T')[0],
          })
          stats.reminders33++
        }
      } catch (e) {
        console.error('Failed to process reminder for order', order2.id, e)
      }
    }
  }

  return stats
}
