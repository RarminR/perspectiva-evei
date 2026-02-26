import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const guides = await prisma.guide.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(guides)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, slug, description, price, coverImage, audioKey, contentJson } = body

  const guide = await prisma.guide.create({
    data: {
      title,
      slug,
      description: description || null,
      price: parseFloat(price),
      coverImage: coverImage || null,
      audioKey: audioKey || null,
      contentJson: contentJson || null,
    },
  })

  return NextResponse.json(guide, { status: 201 })
}
