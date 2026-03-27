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
  const caseStudy = await prisma.caseStudy.findUnique({ where: { id } })

  if (!caseStudy) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(caseStudy)
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
  const { title, slug, content, coverImage, testimonialQuote, clientName } = body

  const caseStudy = await prisma.caseStudy.update({
    where: { id },
    data: {
      title,
      slug,
      content: content || null,
      coverImage: coverImage || null,
      testimonialQuote: testimonialQuote || null,
      clientName: clientName || null,
    },
  })

  revalidatePath('/')
  return NextResponse.json(caseStudy)
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
  await prisma.caseStudy.delete({ where: { id } })
  revalidatePath('/')
  return NextResponse.json({ success: true })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { action } = body

  if (action === 'publish') {
    const caseStudy = await prisma.caseStudy.update({
      where: { id },
      data: { published: true },
    })
    revalidatePath('/')
    return NextResponse.json(caseStudy)
  }

  if (action === 'unpublish') {
    const caseStudy = await prisma.caseStudy.update({
      where: { id },
      data: { published: false },
    })
    revalidatePath('/')
    return NextResponse.json(caseStudy)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
