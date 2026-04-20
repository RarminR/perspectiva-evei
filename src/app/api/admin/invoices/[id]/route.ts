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

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      order: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  if (!invoice) {
    return NextResponse.json({ error: 'Factură negăsită' }, { status: 404 })
  }

  return NextResponse.json({ invoice })
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

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { order: true },
  })

  if (!invoice) {
    return NextResponse.json({ error: 'Factură negăsită' }, { status: 404 })
  }

  if (action === 'storno') {
    // Attempt SmartBill storno if invoice has series/number
    if (invoice.smartbillSeries && invoice.smartbillNumber) {
      try {
        const { stornoInvoice } = await import('@/services/smartbill')
        await stornoInvoice({
          companyVatCode: process.env.SMARTBILL_COMPANY_VAT_CODE || '',
          seriesName: invoice.smartbillSeries,
          number: invoice.smartbillNumber,
        })
      } catch (error) {
        console.error('SmartBill storno error:', error)
      }
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'STORNO' },
    })

    return NextResponse.json({ invoice: updated })
  }

  if (action === 'retry') {
    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'PENDING', errorText: null },
    })

    return NextResponse.json({ invoice: updated })
  }

  return NextResponse.json({ error: 'Acțiune invalidă' }, { status: 400 })
}
