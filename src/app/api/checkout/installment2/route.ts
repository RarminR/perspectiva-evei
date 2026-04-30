import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createInstallmentOrder2 } from '@/services/installments'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.redirect(new URL('/logare', process.env.NEXT_PUBLIC_APP_URL || 'https://perspectiva-evei.vercel.app'))
  }

  const userId = (session.user as any).id

  const order1 = await prisma.order.findFirst({
    where: { userId, installmentNumber: 1, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (!order1) {
    return NextResponse.json({ error: 'Nu am găsit prima rată plătită.' }, { status: 404 })
  }

  const existing = await prisma.order.findFirst({
    where: { parentOrderId: order1.id, installmentNumber: 2 },
    select: { revolutCheckoutUrl: true, status: true },
  })

  if (existing?.status === 'COMPLETED') {
    return NextResponse.json({ error: 'A doua rată este deja plătită.' }, { status: 400 })
  }

  if (existing?.revolutCheckoutUrl) {
    return NextResponse.redirect(existing.revolutCheckoutUrl)
  }

  const result = await createInstallmentOrder2(order1.id)
  if (!result.success || !result.checkoutUrl) {
    return NextResponse.json({ error: result.error || 'Nu am putut crea rata 2.' }, { status: 500 })
  }

  return NextResponse.redirect(result.checkoutUrl)
}
