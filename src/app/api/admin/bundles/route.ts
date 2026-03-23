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
  const { guideIds, ...bundleData } = body

  const bundle = await prisma.bundle.create({
    data: {
      title: bundleData.title,
      slug: bundleData.slug,
      price: bundleData.price,
      originalPrice: bundleData.originalPrice,
      active: bundleData.active ?? true,
    },
  })

  if (Array.isArray(guideIds) && guideIds.length > 0) {
    await prisma.bundleItem.createMany({
      data: guideIds.map((guideId: string) => ({
        bundleId: bundle.id,
        guideId,
      })),
    })
  }

  const result = await prisma.bundle.findUnique({
    where: { id: bundle.id },
    include: { items: { include: { guide: true } } },
  })

  return NextResponse.json({ bundle: result }, { status: 201 })
}
