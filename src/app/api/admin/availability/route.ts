import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: any = { active: true }

  if (from && to) {
    where.date = {
      gte: new Date(from),
      lte: new Date(to),
    }
  }

  const slots = await prisma.availability.findMany({
    where,
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  return NextResponse.json({ slots })
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const body = await request.json()

  if (!body.date || !body.startTime || !body.endTime) {
    return NextResponse.json(
      { error: 'Câmpurile date, startTime și endTime sunt obligatorii' },
      { status: 400 }
    )
  }

  const slot = await prisma.availability.create({
    data: {
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
    },
  })

  return NextResponse.json({ slot }, { status: 201 })
}
