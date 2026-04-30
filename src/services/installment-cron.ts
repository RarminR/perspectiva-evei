import { prisma } from '@/lib/db'
import { sendInstallmentReminderEmail } from '@/services/email'
import { createOrder } from '@/services/revolut'

const INSTALLMENT_AMOUNT_CENTS = 64400
const INSTALLMENT_AMOUNT_EUR = 644
const DAY_MS = 24 * 60 * 60 * 1000
const REMINDER_DAYS_BEFORE = 2

export interface InstallmentCronStats {
  order2Created: number
  remindersSent: number
  flagged: number
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS)
}

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function processInstallmentReminders(): Promise<InstallmentCronStats> {
  const stats: InstallmentCronStats = {
    order2Created: 0,
    remindersSent: 0,
    flagged: 0,
  }

  const editions = await prisma.courseEdition.findMany({
    where: { secondInstallmentDueDate: { not: null } },
    select: { id: true, secondInstallmentDueDate: true },
  })

  const now = new Date()

  for (const edition of editions) {
    if (!edition.secondInstallmentDueDate) continue

    const daysUntilDue = daysBetween(now, edition.secondInstallmentDueDate)
    const isReminderWindow = daysUntilDue === REMINDER_DAYS_BEFORE
    const isPastDue = daysUntilDue < 0

    if (!isReminderWindow && !isPastDue) continue

    const order1s = await prisma.order.findMany({
      where: {
        installmentNumber: 1,
        status: 'COMPLETED',
        items: { some: { productType: 'COURSE', productId: edition.id } },
      },
      select: {
        id: true,
        userId: true,
        currency: true,
        user: { select: { email: true, name: true } },
      },
    })

    for (const order1 of order1s) {
      let order2 = await prisma.order.findFirst({
        where: { parentOrderId: order1.id, installmentNumber: 2 },
        select: { id: true, status: true, revolutCheckoutUrl: true },
      })

      if (order2?.status === 'COMPLETED') continue

      // 2 days before due: ensure Order 2 exists, send reminder
      if (isReminderWindow) {
        if (!order2) {
          try {
            const revolutOrder = await createOrder({
              amount: INSTALLMENT_AMOUNT_CENTS,
              currency: order1.currency,
              description: 'Cursul A.D.O. - Rata 2 din 2',
              expirePendingAfter: 'P7D',
            })

            const created = await prisma.order.create({
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
                      productId: edition.id,
                      quantity: 1,
                      unitPrice: INSTALLMENT_AMOUNT_EUR,
                    },
                  ],
                },
              },
              select: { id: true, status: true, revolutCheckoutUrl: true },
            })

            order2 = created
            stats.order2Created++
          } catch (e) {
            console.error('Failed to create Order 2 for', order1.id, e)
            continue
          }
        }

        try {
          await sendInstallmentReminderEmail(order1.user.email, {
            name: order1.user.name || 'Dragă cursant',
            amount: `${INSTALLMENT_AMOUNT_EUR} EUR`,
            checkoutUrl: order2.revolutCheckoutUrl || '',
            dueDate: isoDate(edition.secondInstallmentDueDate),
          })
          stats.remindersSent++
        } catch (e) {
          console.error('Failed to send reminder for order', order2.id, e)
        }
      }

      // Past due: flag pending Order 2 as FAILED
      if (isPastDue && order2 && order2.status === 'PENDING') {
        try {
          await prisma.order.update({
            where: { id: order2.id },
            data: { status: 'FAILED' },
          })
          stats.flagged++
        } catch (e) {
          console.error('Failed to flag order', order2.id, e)
        }
      }
    }
  }

  return stats
}
