import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, installmentNumber: true },
  })

  if (!order) {
    return NextResponse.json({ error: 'Comanda nu a fost găsită.' }, { status: 404 })
  }

  if (order.installmentNumber !== 2) {
    return NextResponse.json(
      { error: 'Această acțiune este doar pentru rata 2.' },
      { status: 400 }
    )
  }

  if (order.status === 'COMPLETED') {
    return NextResponse.json({ success: true, alreadyPaid: true })
  }

  await prisma.order.update({
    where: { id },
    data: { status: 'COMPLETED' },
  })

  return NextResponse.json({ success: true })
}
