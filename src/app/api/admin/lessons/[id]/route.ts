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
  const lesson = await prisma.lesson.findUnique({ where: { id } })

  if (!lesson) {
    return NextResponse.json({ error: 'Lecția nu a fost găsită.' }, { status: 404 })
  }

  return NextResponse.json(lesson)
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
  const { title, order, videoKey, zoomLink, pdfKeys, duration, availableFrom } = body

  const lesson = await prisma.lesson.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(order !== undefined && { order: Number(order) }),
      ...(videoKey !== undefined && { videoKey: videoKey || null }),
      ...(zoomLink !== undefined && { zoomLink: zoomLink || null }),
      ...(pdfKeys !== undefined && { pdfKeys: Array.isArray(pdfKeys) ? pdfKeys : [] }),
      ...(duration !== undefined && { duration: duration ? Number(duration) : null }),
      ...(availableFrom !== undefined && { availableFrom: availableFrom ? new Date(availableFrom) : null }),
    },
  })

  return NextResponse.json(lesson)
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
  await prisma.lesson.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
