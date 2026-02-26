import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const courses = await prisma.course.findMany({
    include: { editions: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(courses)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, slug, description, price, installmentPrice, maxParticipants, accessDurationDays } = body

  if (!title || !slug || price === undefined) {
    return NextResponse.json({ error: 'Titlul, slug-ul și prețul sunt obligatorii.' }, { status: 400 })
  }

  const course = await prisma.course.create({
    data: {
      title,
      slug,
      description: description || null,
      price: Number(price),
      installmentPrice: installmentPrice ? Number(installmentPrice) : null,
      maxParticipants: maxParticipants ? Number(maxParticipants) : 15,
      accessDurationDays: accessDurationDays ? Number(accessDurationDays) : 30,
    },
  })

  return NextResponse.json(course, { status: 201 })
}
