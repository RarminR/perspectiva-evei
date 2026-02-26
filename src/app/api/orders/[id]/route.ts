import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { getOrderStatus } from '@/services/checkout'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const order = await getOrderStatus(params.id)
  if (!order || order.userId !== (session.user as { id: string }).id) {
    return NextResponse.json({ error: 'Comanda nu a fost găsită' }, { status: 404 })
  }

  return NextResponse.json({ order })
}
