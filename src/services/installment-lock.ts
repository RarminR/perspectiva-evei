import { prisma } from '@/lib/db'

export type InstallmentLockState =
  | { kind: 'unlocked' }
  | { kind: 'grace'; dueDate: Date; order2CheckoutUrl: string | null }
  | { kind: 'locked'; dueDate: Date; order2CheckoutUrl: string | null }

export async function getInstallmentLock(
  userId: string,
  editionId: string
): Promise<InstallmentLockState> {
  const order1 = await prisma.order.findFirst({
    where: {
      userId,
      installmentNumber: 1,
      status: 'COMPLETED',
      items: { some: { productType: 'COURSE', productId: editionId } },
    },
    select: { id: true },
  })

  if (!order1) {
    return { kind: 'unlocked' }
  }

  const order2 = await prisma.order.findFirst({
    where: { parentOrderId: order1.id, installmentNumber: 2 },
    select: { id: true, status: true, revolutCheckoutUrl: true },
  })

  if (order2?.status === 'COMPLETED') {
    return { kind: 'unlocked' }
  }

  const edition = await prisma.courseEdition.findUnique({
    where: { id: editionId },
    select: { secondInstallmentDueDate: true },
  })

  if (!edition?.secondInstallmentDueDate) {
    return { kind: 'unlocked' }
  }

  const dueDate = edition.secondInstallmentDueDate
  const now = new Date()
  const order2CheckoutUrl = order2?.revolutCheckoutUrl ?? null

  if (now <= dueDate) {
    return { kind: 'grace', dueDate, order2CheckoutUrl }
  }
  return { kind: 'locked', dueDate, order2CheckoutUrl }
}
