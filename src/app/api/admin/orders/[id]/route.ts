import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
      invoices: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Comandă negăsită' }, { status: 404 })
  }

  return NextResponse.json({ order })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const { id } = await params
  const { action } = await req.json()

  if (action === 'refund') {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Comandă negăsită' }, { status: 404 })
    }

    // Attempt Revolut refund if order has a real Revolut order
    const isRealRevolutOrder =
      order.revolutOrderId && !order.revolutOrderId.startsWith('dev-bypass-')
    if (isRealRevolutOrder) {
      try {
        const { refundOrder } = await import('@/services/revolut')
        await refundOrder(order.revolutOrderId!, {
          amount: Math.round(order.totalAmount * 100),
          description: `Refund comandă ${order.id}`,
        })
      } catch (error) {
        console.error('Revolut refund error:', error)
        return NextResponse.json(
          {
            error:
              'Rambursarea Revolut a eșuat. Verifică în Revolut și reîncearcă. Comanda nu a fost anulată.',
            detail: error instanceof Error ? error.message : String(error),
          },
          { status: 502 }
        )
      }
    }

    // Revoke fulfilled access so refunded customers lose the product
    for (const item of order.items) {
      if (item.productType === 'GUIDE') {
        await prisma.guideAccess.deleteMany({
          where: { userId: order.userId, guideId: item.productId, orderId: order.id },
        })
      } else if (item.productType === 'BUNDLE') {
        const bundle = await prisma.bundle.findUnique({
          where: { id: item.productId },
          include: { items: { select: { guideId: true } } },
        })
        if (bundle) {
          await prisma.guideAccess.deleteMany({
            where: {
              userId: order.userId,
              orderId: order.id,
              guideId: { in: bundle.items.map((b) => b.guideId) },
            },
          })
        }
      } else if (item.productType === 'COURSE') {
        await prisma.courseEnrollment.deleteMany({
          where: { userId: order.userId, editionId: item.productId, orderId: order.id },
        })
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ order: updated })
  }

  return NextResponse.json({ error: 'Acțiune invalidă' }, { status: 400 })
}
