import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
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
  const {
    title,
    slug,
    description,
    price,
    coverImage,
    pdfKey,
    audioKey,
    audioDurationMinutes,
    contentJson,
  } = body

  const audioDuration =
    audioDurationMinutes !== undefined && audioDurationMinutes !== '' && audioDurationMinutes !== null
      ? Math.round(Number(audioDurationMinutes) * 60)
      : null

  const guide = await prisma.guide.create({
    data: {
      title,
      slug,
      description: description || null,
      price: parseFloat(price),
      coverImage: coverImage || null,
      pdfKey: pdfKey || null,
      audioKey: audioKey || null,
      audioDuration,
      contentJson: contentJson || null,
    },
  })

  revalidatePath('/ghiduri')
  revalidatePath('/')
  return NextResponse.json(guide, { status: 201 })
}
