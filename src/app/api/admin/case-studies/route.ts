import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const caseStudies = await prisma.caseStudy.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(caseStudies)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, slug, content, coverImage, testimonialQuote, clientName } = body

  const caseStudy = await prisma.caseStudy.create({
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
  return NextResponse.json(caseStudy, { status: 201 })
}
