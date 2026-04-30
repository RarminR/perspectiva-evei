import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = { ...body }
  if ('appliesTo' in body) {
    if (Array.isArray(body.appliesTo)) {
      const filtered = body.appliesTo.filter(
        (entry: unknown): entry is { type: string; id: string } =>
          !!entry &&
          typeof entry === 'object' &&
          typeof (entry as any).type === 'string' &&
          typeof (entry as any).id === 'string'
      )
      data.appliesTo = filtered.length > 0 ? filtered : null
    } else if (body.appliesTo === null) {
      data.appliesTo = null
    } else {
      delete data.appliesTo
    }
  }

  const code = await prisma.promoCode.update({ where: { id }, data })
  return NextResponse.json({ code })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await prisma.promoCode.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
