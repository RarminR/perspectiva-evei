import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { fulfillOrder } from '@/services/order-fulfillment'
import type { OrderStatus } from '@prisma/client'

const VALID_STATUSES: string[] = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const userId = url.searchParams.get('userId')

  const statusFilter = status && VALID_STATUSES.includes(status)
    ? (status as OrderStatus)
    : undefined

  const orders = await prisma.order.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(userId ? { userId } : {}),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const { orderId } = (await req.json()) as { orderId?: string }
  if (!orderId) {
    return NextResponse.json({ error: 'orderId lipsă' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) {
    return NextResponse.json({ error: 'Comanda nu există' }, { status: 404 })
  }

  await fulfillOrder(orderId)
  return NextResponse.json({ success: true })
}
