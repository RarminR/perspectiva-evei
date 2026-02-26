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
    const order = await prisma.order.findUnique({ where: { id } })

    if (!order) {
      return NextResponse.json({ error: 'Comandă negăsită' }, { status: 404 })
    }

    // Attempt Revolut refund if order has a revolut ID
    if (order.revolutOrderId) {
      try {
        const { refundOrder } = await import('@/services/revolut')
        await refundOrder(order.revolutOrderId)
      } catch (error) {
        console.error('Revolut refund error:', error)
        // Continue — mark as cancelled even if Revolut fails
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
