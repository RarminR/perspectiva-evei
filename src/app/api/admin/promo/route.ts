import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ codes })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const code = await prisma.promoCode.create({
    data: {
      code: body.code,
      type: body.type,
      value: body.value,
      maxUses: body.maxUses || null,
      validFrom: body.validFrom ? new Date(body.validFrom) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      active: body.active ?? true,
    },
  })
  return NextResponse.json({ code }, { status: 201 })
}
