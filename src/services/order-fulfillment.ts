import { prisma } from '@/lib/db'
import { sendOrderConfirmationEmail, sendSessionBookedEmail } from './email'
import { processInvoiceQueue, queueInvoice } from './invoice-pipeline'
import { SESSION_PRICING } from '@/lib/constants/pricing'

function getEnrollmentExpiryDate(): Date {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
}

export async function fulfillOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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

  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }

  if (order.status === 'COMPLETED') {
    return
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'COMPLETED' },
  })

  for (const item of order.items) {
    if (item.productType === 'COURSE') {
      await prisma.courseEnrollment.upsert({
        where: { userId_editionId: { userId: order.userId, editionId: item.productId } },
        update: { orderId: order.id, status: 'ACTIVE' },
        create: {
          userId: order.userId,
          editionId: item.productId,
          orderId: order.id,
          status: 'ACTIVE',
          accessExpiresAt: getEnrollmentExpiryDate(),
        },
      })
    }

    if (item.productType === 'GUIDE') {
      await prisma.guideAccess.upsert({
        where: { userId_guideId: { userId: order.userId, guideId: item.productId } },
        update: { orderId: order.id },
        create: {
          userId: order.userId,
          guideId: item.productId,
          orderId: order.id,
        },
      })
    }

    if (item.productType === 'SESSION') {
      const scheduledAt = new Date(item.productId)
      if (Number.isNaN(scheduledAt.getTime())) {
        console.error('SESSION order item has invalid scheduledAt:', item.productId)
        continue
      }
      const conflict = await prisma.session1on1.findFirst({
        where: { scheduledAt, status: 'BOOKED' },
      })
      if (conflict) {
        console.error(
          `SESSION slot ${scheduledAt.toISOString()} already booked — order ${order.id} paid but session not created`
        )
        continue
      }
      const booked = await prisma.session1on1.create({
        data: {
          userId: order.userId,
          scheduledAt,
          duration: SESSION_PRICING.DURATION_MINUTES,
          status: 'BOOKED',
        },
      })
      try {
        await sendSessionBookedEmail(order.user.email, {
          name: order.user.name,
          sessionDate: scheduledAt.toLocaleDateString('ro-RO'),
          sessionTime: scheduledAt.toLocaleTimeString('ro-RO', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })
      } catch (error) {
        console.error('Failed to send session booked email:', error)
      }
      void booked
    }
  }

  try {
    const firstItem = order.items[0]
    await sendOrderConfirmationEmail(order.user.email, {
      name: order.user.name,
      orderNumber: order.id,
      productName: firstItem ? `${firstItem.productType} ${firstItem.productId}` : 'Produse digitale',
      amount: `${order.totalAmount.toFixed(2)} ${order.currency}`,
    })
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
  }

  try {
    await queueInvoice(order.id)
    await processInvoiceQueue()
  } catch (error) {
    console.error('Failed to create SmartBill invoice:', error)
  }
}
