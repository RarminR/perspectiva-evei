import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { processInvoiceQueue, queueInvoice } from '@/services/invoice-pipeline'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!order) {
    return NextResponse.json({ error: 'Comandă negăsită' }, { status: 404 })
  }
  if (order.status !== 'COMPLETED') {
    return NextResponse.json(
      { error: 'Doar comenzile finalizate pot genera facturi.' },
      { status: 400 }
    )
  }

  await queueInvoice(order.id)
  await processInvoiceQueue()

  const invoice = await prisma.invoice.findFirst({
    where: { orderId: order.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ invoice })
}
