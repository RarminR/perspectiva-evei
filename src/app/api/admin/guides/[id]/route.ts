import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
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
  const guide = await prisma.guide.findUnique({ where: { id } })

  if (!guide) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(guide)
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
  const { title, slug, description, price, coverImage, pdfKey, audioKey, contentJson } = body

  const guide = await prisma.guide.update({
    where: { id },
    data: {
      title,
      slug,
      description: description || null,
      price: parseFloat(price),
      coverImage: coverImage || null,
      pdfKey: pdfKey || null,
      audioKey: audioKey || null,
      contentJson: contentJson || null,
    },
  })

  revalidatePath('/ghiduri')
  revalidatePath('/')
  return NextResponse.json(guide)
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

  // Check for active access
  const accessCount = await prisma.guideAccess.count({ where: { guideId: id } })
  if (accessCount > 0) {
    return NextResponse.json(
      { error: 'Nu poți șterge un ghid cu acces activ' },
      { status: 400 }
    )
  }

  await prisma.guide.delete({ where: { id } })
  revalidatePath('/ghiduri')
  revalidatePath('/')
  return NextResponse.json({ success: true })
}
