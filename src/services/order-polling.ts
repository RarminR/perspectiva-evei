import { prisma } from '@/lib/db'
import { getOrder } from './revolut'
import { fulfillOrder } from './order-fulfillment'

export async function pollPendingOrders(): Promise<{ processed: number; fulfilled: number }> {
  const cutoff = new Date(Date.now() - 35 * 60 * 1000)
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff },
      revolutOrderId: { not: null },
    },
  })

  let fulfilled = 0

  for (const order of pendingOrders) {
    try {
      const revolutOrder = await getOrder(order.revolutOrderId as string)

      if (revolutOrder.state === 'COMPLETED') {
        await fulfillOrder(order.id)
        fulfilled += 1
      } else if (revolutOrder.state === 'FAILED' || revolutOrder.state === 'CANCELLED') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: revolutOrder.state },
        })
      }
    } catch (error) {
      console.error(`Failed to poll order ${order.id}:`, error)
    }
  }

  return { processed: pendingOrders.length, fulfilled }
}
