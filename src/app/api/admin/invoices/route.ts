import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { InvoiceStatus } from '@prisma/client'

const VALID_STATUSES: string[] = ['PENDING', 'CREATED', 'FAILED', 'STORNO']

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

  const statusFilter = status && VALID_STATUSES.includes(status)
    ? (status as InvoiceStatus)
    : undefined

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      order: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ invoices })
}
