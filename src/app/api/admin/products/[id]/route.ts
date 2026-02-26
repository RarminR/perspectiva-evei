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
  const product = await prisma.product.findUnique({ where: { id } })

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { title, slug, description, price, stock, images, active } = body

  const product = await prisma.product.update({
    where: { id },
    data: {
      title,
      slug,
      description: description || null,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      images: Array.isArray(images) ? images : images ? images.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      active: active !== false,
    },
  })

  return NextResponse.json(product)
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
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
