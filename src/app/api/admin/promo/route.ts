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
  const appliesTo = Array.isArray(body.appliesTo) && body.appliesTo.length > 0
    ? body.appliesTo
        .filter((entry: unknown): entry is { type: string; id: string } =>
          !!entry &&
          typeof entry === 'object' &&
          typeof (entry as any).type === 'string' &&
          typeof (entry as any).id === 'string'
        )
    : null

  const code = await prisma.promoCode.create({
    data: {
      code: body.code,
      type: body.type,
      value: body.value,
      maxUses: body.maxUses || null,
      validFrom: body.validFrom ? new Date(body.validFrom) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      active: body.active ?? true,
      appliesTo: appliesTo && appliesTo.length > 0 ? appliesTo : undefined,
    },
  })
  return NextResponse.json({ code }, { status: 201 })
}
