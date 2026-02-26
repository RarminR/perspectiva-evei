import { prisma } from '@/lib/db'
import { sendOrderConfirmationEmail } from './email'

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
}
