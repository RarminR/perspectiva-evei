import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bundles = await prisma.bundle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })
  return NextResponse.json({ bundles })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const bundle = await prisma.bundle.create({
    data: {
      title: body.title,
      slug: body.slug,
      price: body.price,
      originalPrice: body.originalPrice,
      active: body.active ?? true,
    },
  })
  return NextResponse.json({ bundle }, { status: 201 })
}
