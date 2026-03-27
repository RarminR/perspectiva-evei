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
  const post = await prisma.blogPost.findUnique({ where: { id } })

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(post)
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
  const { title, slug, content, coverImage } = body

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      content: content || null,
      coverImage: coverImage || null,
    },
  })

  revalidatePath('/blog')
  return NextResponse.json(post)
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
  await prisma.blogPost.delete({ where: { id } })
  revalidatePath('/blog')
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
    const post = await prisma.blogPost.update({
      where: { id },
      data: { published: true, publishedAt: new Date() },
    })
    revalidatePath('/blog')
    return NextResponse.json(post)
  }

  if (action === 'unpublish') {
    const post = await prisma.blogPost.update({
      where: { id },
      data: { published: false, publishedAt: null },
    })
    revalidatePath('/blog')
    return NextResponse.json(post)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
