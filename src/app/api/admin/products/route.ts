import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, slug, description, price, stock, images, active } = body

  const product = await prisma.product.create({
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

  revalidatePath('/')
  return NextResponse.json(product, { status: 201 })
}
