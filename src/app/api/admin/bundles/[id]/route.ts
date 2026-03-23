import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const bundle = await prisma.bundle.findUnique({
    where: { id },
    include: { items: { include: { guide: true } } },
  })

  if (!bundle) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(bundle)
}

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

  const { guideIds, ...bundleData } = body

  await prisma.bundle.update({
    where: { id },
    data: bundleData,
  })

  if (Array.isArray(guideIds)) {
    await prisma.bundleItem.deleteMany({ where: { bundleId: id } })
    if (guideIds.length > 0) {
      await prisma.bundleItem.createMany({
        data: guideIds.map((guideId: string) => ({
          bundleId: id,
          guideId,
        })),
      })
    }
  }

  const updated = await prisma.bundle.findUnique({
    where: { id },
    include: { items: { include: { guide: true } } },
  })

  return NextResponse.json(updated)
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
  await prisma.bundleItem.deleteMany({ where: { bundleId: id } })
  await prisma.bundle.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
